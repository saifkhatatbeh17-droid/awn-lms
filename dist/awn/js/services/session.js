/* Shared session lifecycle. Server validation is authoritative in connected mode. */
(() => {
  const KEY = 'awn_session';
  const roles = window.AwnRoles;
  function sanitize(raw) {
    if (!raw || !raw.username || !roles.definitions[raw.role] || raw.isActive === false) return null;
    return { username:String(raw.username), name:String(raw.name || ''), role:raw.role, ...(raw.id !== undefined ? { id:raw.id } : {}), ...(raw.organization ? { organization:String(raw.organization) } : {}) };
  }
  function current() { return sanitize(AwnUtils.storage.read(KEY)); }
  function set(raw) { const user=sanitize(raw); if (!user) throw new Error('AUTH_RESPONSE_INVALID'); AwnUtils.storage.write(KEY,user); window.dispatchEvent(new CustomEvent('awn:session',{ detail:user })); return user; }
  function clear() { AwnUtils.storage.remove(KEY); window.dispatchEvent(new CustomEvent('awn:session',{detail:null})); }
  function requireRole(expected = roles.pageRole()) {
    const user=current();
    if (user && (!expected || user.role === expected)) return true;
    location.replace(user ? roles.dashboards[user.role] : 'index.html');
    return false;
  }
  async function refresh() {
    if (!AWN_CONFIG.apiBaseUrl) {
      if (!AWN_CONFIG.demoMode) { clear(); return null; }
      const user=current();
      const users=AwnUtils.storage.read('awn_users',[]);
      if (user && Array.isArray(users) && users.some((entry) => entry.username === user.username && (entry.isActive === false || entry.role !== user.role))) { clear(); return null; }
      return user;
    }
    try { const payload=await AwnHttp.data('/api/auth/me',{skipUnauthorized:true}); return set(payload?.user ?? payload); }
    catch (error) { clear(); if (error.status !== 401) window.dispatchEvent(new CustomEvent('awn:session-error',{detail:error})); return null; }
  }
  async function login(username,password,{signal}={}) {
    if (AWN_CONFIG.apiBaseUrl) {
      const payload=await AwnHttp.data('/api/auth/login',{method:'POST',body:JSON.stringify({username,password}),signal,skipUnauthorized:true});
      return set(payload?.user ?? payload);
    }
    if (!AWN_CONFIG.demoMode) throw new Error('AUTH_API_NOT_CONFIGURED');
    const users=await AwnDemo.collection("awn_users","users.json");
    const user=users.find((entry) => String(entry.username).trim().toLowerCase() === String(username).trim().toLowerCase() && String(entry.password) === String(password) && entry.isActive !== false);
    if (!user) throw new Error('بيانات الدخول غير صحيحة');
    return set(user);
  }
  async function logout() {
    if (AWN_CONFIG.apiBaseUrl) {
      try { await AwnHttp.request('/api/auth/logout',{method:'POST',skipUnauthorized:true}); }
      catch (error) { if (error.status !== 401) { window.AwnUI?.notify('تعذر إنهاء الجلسة على الخادم. أعد المحاولة.','error'); return false; } }
    }
    clear(); location.assign('index.html'); return true;
  }
  const ready = refresh().then((user) => {
    const expected=roles.pageRole();
    if (expected && !requireRole(expected)) return null;
    document.documentElement.dataset.authState='ready';
    return user;
  });
  if (roles.pageRole()) document.documentElement.dataset.authState='checking';
  window.AwnSession=Object.freeze({ current,set,clear,refresh,login,logout,requireRole,ready });
  window.addEventListener('awn:unauthorized',() => { clear(); if (roles.pageRole()) location.replace('index.html'); });
  document.addEventListener('click',(event) => {
    if (!event.target.closest('[data-logout], [data-admin-logout]')) return;
    event.preventDefault(); event.stopImmediatePropagation(); logout();
  },true);
})();
