/* One shell renderer. Role definitions contain data, not copied sidebar markup. */
(() => {
  const escape = (value) => AwnUtils.escapeHtml(value);
  function navItem(item, admin, initial) {
    const current=item.id === initial ? ' aria-current="page"' : '';
    const icon=`<span class="material-symbols-outlined" aria-hidden="true">${escape(item.icon)}</span>`;
    const badge=item.badgeId ? `<span id="${escape(item.badgeId)}" class="awn-nav-badge" aria-label="طلبات قيد المراجعة">0</span>` : '';
    const content=`${icon}<span class="awn-nav-label">${escape(item.label)}</span>${badge}`;
    return (item.group ? `<div class="awn-nav-group">${escape(item.group)}</div>` : '') + (admin ? `<button class="admin-nav__item${current ? ' is-active' : ''}" type="button" data-view="${escape(item.id)}"${current}>${content}</button>` : `<a href="#${escape(item.id)}" data-path="${escape(item.id)}"${current}>${content}</a>`);
  }
  function mount() {
    const roleKey=AwnRoles.pageRole();
    const role=AwnRoles.definitions[roleKey];
    if (!role) return;
    document.body.classList.add('awn-dashboard');
    const admin=roleKey === 'admin';
    const sidebar=document.querySelector('[data-app-sidebar]');
    const header=document.querySelector('[data-app-header]');
    const main=document.querySelector('main');
    header.parentElement.classList.add('awn-workspace');
    main.classList.add('awn-content');
    main.id=admin ? 'admin-main' : 'dashboard-main'; main.tabIndex=-1;
    const name=AwnSession.current()?.name || role.label;
    sidebar.innerHTML=`<div class="awn-sidebar__brand-row">${AwnBrand.render()}<button class="awn-sidebar__close" type="button" data-awn-sidebar-close aria-label="إغلاق القائمة"><span aria-hidden="true">×</span></button></div><div class="awn-sidebar__identity"><span class="awn-sidebar__avatar" data-user-initials aria-hidden="true">ع</span><div><strong ${admin ? 'data-admin-name' : 'data-user-name'}>${escape(name)}</strong><span data-user-role>${escape(role.label)}</span></div></div><nav class="awn-sidebar__nav${admin ? ' admin-nav' : ''}" aria-label="أقسام لوحة ${escape(role.label)}">${role.navigation.map((item)=>navItem(item,admin,role.navigation[0].id)).join('')}</nav><div class="awn-sidebar__footer"><div class="awn-sidebar__mode"><span aria-hidden="true"></span><span ${admin ? 'data-mode-label' : 'data-awn-mode'}>مساحة المدرسة</span></div><a href="index.html" ${admin ? 'data-admin-logout' : 'data-logout'}><span class="material-symbols-outlined" aria-hidden="true">logout</span><span>تسجيل الخروج</span></a></div>`;
    header.innerHTML=`<button class="awn-header__menu" type="button" ${admin ? 'data-sidebar-toggle' : 'data-awn-sidebar-toggle'} aria-controls="${sidebar.id}" aria-label="فتح القائمة" aria-expanded="false"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button><div class="awn-header__context"><span>مساحة المدرسة</span><span aria-hidden="true">/</span><strong>${escape(role.label)}</strong></div><label class="awn-header__search"><span class="material-symbols-outlined" aria-hidden="true">search</span><span class="awn-sr-only">ابحث في أقسام اللوحة</span><input type="search" placeholder="ابحث في مساحتك..." data-shell-search></label><div class="awn-header__profile"><span data-user-initials aria-hidden="true">ع</span><div><strong ${admin ? 'data-admin-name' : 'data-user-name'}>${escape(name)}</strong><small data-user-role>${escape(role.label)}</small></div></div>`;
    header.classList.add('awn-header');
    document.querySelector('[data-shell-search]').addEventListener('keydown',(event)=>{
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const query=event.target.value.trim();
      if (!query) return;
      const item=role.navigation.find((entry)=>entry.label.includes(query));
      if (item) sidebar.querySelector(admin ? `[data-view="${item.id}"]` : `[data-path="${item.id}"]`)?.click();
      else if (roleKey !== 'teacher') AwnUI.notify('لم يُعثر على قسم بهذا الاسم.');
    });
    function profile() {
      const user=AwnSession.current(); if (!user) return;
      document.querySelectorAll('[data-user-name],[data-admin-name]').forEach((el)=>{el.textContent=user.name || user.username;});
      document.querySelectorAll('[data-user-role]').forEach((el)=>{el.textContent=AwnRoles.definitions[user.role].label;});
      document.querySelectorAll('[data-user-initials]').forEach((el)=>{el.textContent=(user.name || user.username).trim().split(/\s+/).slice(0,2).map((part)=>part[0]).join('');});
    }
    profile(); window.addEventListener('awn:session',profile);
    AwnSession.ready.then(profile);
  }
  window.AwnShell=Object.freeze({ mount });
})();
