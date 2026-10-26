/* Shared role navigation and keyboard-friendly mobile drawer. */
(() => {
  const sidebar = document.querySelector('aside.awn-sidebar');
  if (!sidebar) return;
  const mobile = window.matchMedia('(max-width: 1023px)');
  const toggles = [...document.querySelectorAll('[data-awn-sidebar-toggle], [data-sidebar-toggle]')];
  const backdrop = document.querySelector('#sidebar-overlay, .admin-backdrop');
  let returnFocus;
  let savedOverflow;
  const inertRegions = new Map();

  sidebar.setAttribute('aria-label', 'القائمة الرئيسية');
  sidebar.querySelectorAll('nav .material-symbols-outlined').forEach((icon) => icon.setAttribute('aria-hidden', 'true'));
  const user = AwnSession.current() || {};
  const name = user?.name || user?.username;
  if (name) {
    sidebar.querySelectorAll('[data-user-name], [data-admin-name]').forEach((element) => { element.textContent = name; });
    sidebar.querySelector('[data-user-initials]').textContent = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  }
  const mode = sidebar.querySelector('[data-awn-mode]');
  if (mode) mode.textContent = window.AWN_CONFIG?.demoMode ? 'وضع تجريبي · بيانات محلية' : 'مساحة المدرسة';

  function updateToggles(open) {
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-controls', sidebar.id);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    });
  }
  function setBackdrop(open) {
    if (!backdrop) return;
    if (backdrop.id === 'sidebar-overlay') backdrop.classList.toggle('hidden', !open);
    else backdrop.hidden = !open;
    backdrop.setAttribute('aria-hidden', 'true');
  }
  function close({ restoreFocus = true } = {}) {
    const wasOpen = sidebar.classList.contains('is-open');
    sidebar.classList.remove('is-open');
    sidebar.classList.add('translate-x-full');
    updateToggles(false);
    setBackdrop(false);
    sidebar.removeAttribute('aria-modal');
    sidebar.removeAttribute('role');
    for (const [region, wasInert] of inertRegions) region.inert = wasInert;
    inertRegions.clear();
    if (savedOverflow !== undefined) { document.body.style.overflow = savedOverflow; savedOverflow = undefined; }
    if (restoreFocus && (wasOpen || (mobile.matches && sidebar.contains(document.activeElement)))) {
      const destination = returnFocus?.isConnected ? returnFocus : toggles[0];
      destination?.focus();
    }
    sidebar.inert = mobile.matches;
    if (mobile.matches) sidebar.setAttribute('aria-hidden', 'true');
    else sidebar.removeAttribute('aria-hidden');
  }
  function open() {
    if (!mobile.matches || sidebar.classList.contains('is-open')) return;
    returnFocus = document.activeElement;
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.inert = false;
    sidebar.removeAttribute('aria-hidden');
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-modal', 'true');
    sidebar.classList.remove('translate-x-full');
    sidebar.classList.add('is-open');
    // Cover siblings at each ancestor level, including the nested admin workspace.
    for (let branch = sidebar; branch && branch !== document.body; branch = branch.parentElement) {
      [...branch.parentElement.children].forEach((region) => {
        if (region === branch || region === backdrop || ['SCRIPT', 'STYLE', 'LINK'].includes(region.tagName)) return;
        inertRegions.set(region, region.inert);
        region.inert = true;
      });
    }
    updateToggles(true);
    setBackdrop(true);
    sidebar.querySelector('[data-awn-sidebar-close]').focus();
  }
  window.AwnSidebar = Object.freeze({ open, close });

  // Capture drawer controls so legacy delegated "unavailable action" handlers don't intercept them.
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-awn-sidebar-toggle], [data-sidebar-toggle]');
    const closeButton = event.target.closest('[data-awn-sidebar-close]');
    if (!toggle && !closeButton && event.target !== backdrop) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (toggle && !sidebar.classList.contains('is-open')) open();
    else close();
  }, true);

  sidebar.addEventListener('click', (event) => {
    const item = event.target.closest('[data-path], .admin-nav__item[data-view]');
    if (!item) return;
    requestAnimationFrame(() => {
      sidebar.querySelectorAll('[data-path], .admin-nav__item[data-view]').forEach((link) => {
        if (link === item) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      if (mobile.matches) close();
    });
  });
  document.addEventListener('keydown', (event) => {
    if (!mobile.matches || !sidebar.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter((element) => element.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);
  mobile.addEventListener('change', () => close());
  window.addEventListener('pagehide', () => close({ restoreFocus: false }));
  close({ restoreFocus: false });
})();
