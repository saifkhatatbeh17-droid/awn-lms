/* Compatibility facade: no independent storage or request logic. */
window.ApiService=Object.freeze({ ...window.SchoolService,
  saveAttendance:(...args)=>AttendanceService.save(...args),
  getAttendance:(...args)=>AttendanceService.get(...args),
  getAllAttendance:()=>AttendanceService.list(),
});
