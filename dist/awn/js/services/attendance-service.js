/* Attendance has one domain service, with explicit demo and connected adapters. */
(() => {
  const response=AwnUtils.response;
  const connected=()=>Boolean(AWN_CONFIG.apiBaseUrl);
  async function save(date,records,scope={}) {
    try {
      AwnRoles.requirePermission('attendance:write');
      if (!AwnUtils.validDate(date) || !Array.isArray(records) || !records.every((item)=>item && typeof item.name==='string' && ['present','absent','late'].includes(item.status))) throw new Error('ATTENDANCE_DATA_INVALID');
      if (!connected()) return SchoolService.saveAttendance(date,records,scope);
      return await AwnHttp.request('/api/attendance',{method:'POST',body:JSON.stringify({date,records,className:scope.className || '',period:scope.period || ''})});
    } catch(error) { return response(false,null,error.message); }
  }
  async function get(date,scope={}) {
    try {
      AwnRoles.requirePermission('attendance:read');
      if (!connected()) return SchoolService.getAttendance(date,scope);
      const query=new URLSearchParams({date,className:scope.className || '',period:scope.period || ''});
      return await AwnHttp.request('/api/attendance?'+query);
    } catch(error) { return response(false,null,error.message); }
  }
  async function list() {
    try { AwnRoles.requirePermission('attendance:read'); return connected() ? await AwnHttp.request('/api/attendance') : await SchoolService.getAllAttendance(); }
    catch(error) { return response(false,[],error.message); }
  }
  window.AttendanceService=Object.freeze({save,get,list});
})();
