/* One HTTP boundary for credentials, envelopes, server failures and expired sessions. */
(() => {
  class ApiError extends Error { constructor(message, status = 0, code = 'API_ERROR') { super(message); this.name='ApiError'; this.status=status; this.code=code; } }
  async function request(path, options = {}) {
    const base = window.AWN_CONFIG?.apiBaseUrl;
    if (!base) throw new ApiError('API_NOT_CONFIGURED');
    if (!/^\/api\//.test(path)) throw new ApiError('API_PATH_INVALID');
    const { skipUnauthorized = false, timeoutMs = 15000, ...settings } = options;
    const headers = new Headers(settings.headers || {});
    headers.set('Accept','application/json');
    const isForm = settings.body instanceof FormData;
    if (settings.body !== undefined && !isForm) headers.set('Content-Type','application/json');
    // The backend can inject its anti-forgery token without modifying feature code.
    const csrf = document.querySelector('meta[name="awn-csrf-token"]')?.content;
    if (csrf && !['GET','HEAD'].includes((settings.method || 'GET').toUpperCase())) headers.set('X-XSRF-TOKEN',csrf);
    const controller=new AbortController();
    const abort=()=>controller.abort(settings.signal?.reason);
    if (settings.signal?.aborted) abort();
    settings.signal?.addEventListener('abort',abort,{once:true});
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
    let res;
    try { res = await fetch(base + path, { ...settings, signal:controller.signal, headers, credentials:'include' }); }
    catch (error) {
      if (timedOut) throw new ApiError('انتهت مهلة الاتصال بالخادم',0,'TIMEOUT');
      if (error.name === 'AbortError') throw error;
      throw new ApiError('تعذر الاتصال بالخادم',0,'NETWORK_ERROR');
    } finally { clearTimeout(timer); settings.signal?.removeEventListener('abort',abort); }
    if (res.status === 401 && !skipUnauthorized) window.dispatchEvent(new CustomEvent('awn:unauthorized'));
    let payload = null;
    if (res.status !== 204) {
      try { payload = await res.json(); } catch { if (res.ok) throw new ApiError('استجابة الخادم غير صالحة',res.status,'INVALID_RESPONSE'); }
    }
    if (!res.ok) throw new ApiError(payload?.message || `API_${res.status}`,res.status);
    if (payload?.success === false) throw new ApiError(payload.message || 'تعذر تنفيذ الطلب',res.status,'API_REJECTED');
    return payload && typeof payload.success === 'boolean' ? { success:true, data:payload.data ?? null, message:payload.message || '' } : { success:true, data:payload, message:'' };
  }
  async function data(path, options) { return (await request(path,options)).data; }
  window.AwnHttp = Object.freeze({ request, data, ApiError, response:window.AwnUtils.response });
})();
