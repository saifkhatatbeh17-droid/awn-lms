/* Role, route and permission definitions are shared by every entry point. */
(() => {
  const common = [
    { id: 'view-feedback', label: 'الملاحظات والشكاوى', icon: 'feedback', group: 'الدعم والمعلومات' },
    { id: 'view-about', label: 'عن المدرسة', icon: 'info' },
  ];
  const item = (id, label, icon, extra = {}) => ({ id, label, icon, ...extra });
  const definitions = {
    admin: { label: 'مسؤول النظام', permissions: ['users:read', 'users:write', 'audit:read'], navigation: [item('overview','نظرة عامة','dashboard'),item('users','إدارة المستخدمين','groups'),item('activity','سجل النشاط','history'),item('system','حالة الربط','settings')] },
    principal: { label: 'مدير المدرسة', permissions: ['attendance:read','school:read','teachers:read','leaves:decide','feedback:manage','about:write'], navigation: [item('view-dashboard','نظرة عامة','dashboard'),item('view-teachers','الكادر التعليمي','badge',{group:'الإدارة المدرسية'}),item('view-approvals','الاعتمادات','fact_check',{badgeId:'leaveRequestBadge'}),item('view-school-attendance','دوام الطلبة والموظفين','groups'),item('view-circulars','التعاميم المدرسية','campaign'),item('view-reports','التقارير الشاملة','analytics'),...common] },
    supervisor: { label: 'المشرف التربوي', permissions: ['schools:read','visits:write','evaluations:write','feedback:manage'], navigation: [item('view-dashboard','نظرة عامة','dashboard'),item('view-schools','المدارس التابعة','school',{group:'الإشراف التربوي'}),item('view-visits','الزيارات الميدانية','directions_car'),item('view-evaluations','تقييم المعلمين','grading'),item('view-plans','متابعة الخطط الدراسية','menu_book'),item('view-reports','تقارير الإشراف التربوي','analytics'),...common] },
    teacher: { label: 'المعلم', permissions: ['attendance:read','assignments:read','assignments:create','attendance:write','behavior:write','plans:write','grades:write','leaves:create'], navigation: [item('view-dashboard','الرئيسية','dashboard'),item('view-lesson-plans','الخطط الفصلية','calendar_month',{group:'التخطيط الأكاديمي'}),item('view-daily-plans','الخطط اليومية','edit_calendar'),item('view-attendance','الحضور والغياب','how_to_reg',{group:'متابعة التعلّم'}),item('view-grades','سجل العلامات','grade'),item('view-schedule','الجدول الدراسي','calendar_view_week'),item('view-students','سجل الطلاب','school'),item('view-teacher-profile','ملفي الوظيفي','workspace_premium'),item('view-leave-requests','طلب إجازة / مغادرة','event_available'),...common.map(entry => entry.id === 'view-feedback' ? {...entry, label: 'مركز التواصل', icon: 'forum'} : entry)] },
    student: { label: 'الطالب', permissions: ['assignments:read','assignments:complete','results:read'], navigation: [item('view-dashboard','ملخص الأداء','dashboard'),item('view-schedule','الجدول الدراسي','calendar_month',{group:'مساحتي الدراسية'}),item('view-assignments','الواجبات والمهام','assignment'),item('view-grades','العلامات والنتائج','grade'),item('view-resources','المكتبة الرقمية','local_library'),...common] },
    parent: { label: 'ولي الأمر', permissions: ['children:read','attendance:read','results:read','notifications:read'], navigation: [item('view-dashboard','نظرة عامة','dashboard'),item('view-children','الأبناء المسجلين','groups',{group:'متابعة الأبناء'}),item('view-attendance','الغياب والسلوك','how_to_reg'),item('view-grades','الشهادات والعلامات','grade'),item('view-communication','التواصل مع المدرسة','forum'),item('view-calendar','التقويم المدرسي','event_note'),...common] },
  };
  for (const [key, role] of Object.entries(definitions)) {
    role.page = `${key}-dashboard.html`;
    role.permissions = Object.freeze([...role.permissions, 'feedback:create']);
    role.navigation = Object.freeze(role.navigation.map((entry) => Object.freeze({ ...entry })));
    Object.freeze(role);
  }
  const roles = Object.freeze(definitions);
  const pageRole = () => Object.keys(roles).find((role) => roles[role].page === location.pathname.split('/').pop()) || null;
  function can(permission, role = window.AwnSession?.current()?.role) { return Boolean(roles[role]?.permissions.includes(permission)); }
  function requirePermission(permission) { if (!can(permission)) throw new Error('FORBIDDEN'); }
  window.AwnRoles = Object.freeze({ definitions: roles, pageRole, can, requirePermission, dashboards: Object.freeze(Object.fromEntries(Object.entries(roles).map(([key, role]) => [key, role.page]))) });
})();
