/* Login compatibility exports; session behavior is centralized. */
export const DASHBOARDS_BY_ROLE = window.AwnRoles.dashboards;
export async function authenticate(username,password,options={}) {
  try { const user=await AwnSession.login(username,password,options); return AwnUtils.response(true,{...user,redirect:DASHBOARDS_BY_ROLE[user.role]},'تم تسجيل الدخول بنجاح'); }
  catch(error) { return AwnUtils.response(false,null,error.message || 'تعذر تسجيل الدخول'); }
}
