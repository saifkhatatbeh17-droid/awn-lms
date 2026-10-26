/* Demo persistence has an explicit mode boundary and deduplicated initial reads. */
(() => {
  const pending=new Map();
  function enabled() { return AWN_CONFIG.demoMode === true && !AWN_CONFIG.apiBaseUrl; }
  function assertEnabled() { if (!enabled()) throw new Error('DEMO_STORAGE_DISABLED'); }
  function read(key,fallback=null) { assertEnabled(); return AwnUtils.storage.read(key,fallback); }
  function write(key,value) { assertEnabled(); return AwnUtils.storage.write(key,value); }
  async function collection(key,fileName) {
    assertEnabled();
    const existing=read(key);
    if (Array.isArray(existing)) return existing;
    if (pending.has(key)) return pending.get(key);
    const request=(async()=>{
      const res=await fetch(AWN_CONFIG.getDataUrl(fileName),{headers:{Accept:'application/json'}});
      if (!res.ok) throw new Error('DEMO_SEED_UNAVAILABLE');
      const raw=await res.json(); const items=Array.isArray(raw) ? raw : raw?.items;
      if (!Array.isArray(items)) throw new Error('DEMO_DATA_INVALID');
      const latest=read(key);
      if (Array.isArray(latest)) return latest;
      return write(key,items);
    })();
    pending.set(key,request);
    try { return await request; } finally { pending.delete(key); }
  }
  window.AwnDemo=Object.freeze({enabled,assertEnabled,read,write,collection});
})();
