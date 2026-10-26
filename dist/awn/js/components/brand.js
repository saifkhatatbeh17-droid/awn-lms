/* The brand artwork and lockup exist once for public pages and role dashboards. */
(() => {
  const symbol = '<svg class="brand-symbol" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="54" height="54" fill="none" aria-hidden="true" focusable="false"><path d="M27 32C22 28 16 26 10 27L5 51C15 49 23 52 29 57V36" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 32C42 28 48 26 54 27L59 51C49 49 41 52 35 57V36" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 44V26C32 21 36 17 40 14" stroke="#b78157" stroke-width="3.2" stroke-linecap="round"/><path d="M32 28C23 28 19 23 18 16C26 16 32 20 32 28Z" fill="currentColor"/><path d="M33 21C33 11 39 6 49 7C48 16 42 22 33 21Z" fill="#b78157"/></svg>';
  function render(href='about.html') { return `<a class="brand brand-lockup" href="${AwnUtils.escapeHtml(href)}" aria-label="عون — من نحن">${symbol}<span class="brand-type"><span class="brand-name">عَون<span class="brand-latin" lang="en" dir="ltr">AWN</span></span><span class="brand-tagline">مساحة تجمع مدرستك</span></span></a>`; }
  function hydrate(root=document) { root.querySelectorAll('[data-awn-brand]').forEach((el)=>{ el.innerHTML=render(el.dataset.brandHref || 'about.html'); }); }
  window.AwnBrand=Object.freeze({ render,hydrate,symbol:()=>symbol });
  document.addEventListener('DOMContentLoaded',()=>hydrate());
})();
