'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const core=['config/roles.js','utils/shared.js','services/http-client.js','services/demo-store.js','services/session.js'];
function environment({role='teacher',api='',users=[],session=null,fetcher}={}) {
  const vc=new VirtualConsole();
  const dom=new JSDOM('<!doctype html><html><head><meta name="awn-csrf-token" content="test-token"></head><body></body></html>',{url:`http://localhost/${role}-dashboard.html`,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window; w.Headers=Headers;
  w.AWN_CONFIG={apiBaseUrl:api,demoMode:!api,getDataUrl:(name)=>'http://localhost/assets/data/'+name};
  w.fetch=fetcher || (async(url)=>({ok:true,status:200,json:async()=>String(url).includes('users')?users:{items:[]}}));
  if(session)w.localStorage.setItem('awn_session',JSON.stringify(session));
  for(const file of core)w.eval(fs.readFileSync('awn/js/'+file,'utf8'));
  return {dom,w,load:(file)=>w.eval(fs.readFileSync('awn/js/'+file,'utf8'))};
}
const plain=(value)=>JSON.parse(JSON.stringify(value));
(async()=>{
  const users=[{username:'teacher',password:'123',name:'معلم الاختبار',role:'teacher'},{username:'student',password:'123',name:'طالب الاختبار',role:'student'},{username:'disabled',password:'123',role:'teacher',isActive:false}];
  let env=environment({users}); let {w}=env; await w.AwnSession.ready;
  await w.AwnSession.login('TEACHER','123');
  assert.equal(w.AwnSession.current().role,'teacher');
  assert(!w.localStorage.getItem('awn_session').includes('password'));
  await assert.rejects(w.AwnSession.login('disabled','123'));
  assert(w.AwnRoles.can('assignments:create')); assert(!w.AwnRoles.can('users:write'));
  env.load('services/school-service.js'); env.load('services/assignment-service.js'); env.load('services/attendance-service.js'); env.load('services/apiService.js');
  const created=await w.AssignmentService.create({title:'واجب الاختبار',subject:'الرياضيات',dueDate:'2026-11-01'});
  assert(created.success,created.message);
  assert.equal((await w.AttendanceService.save('2026-11-01',[{name:'طالب الاختبار',status:'absent'}],{className:'العاشر',period:'الأولى'})).success,true);
  assert.equal((await w.ApiService.getAttendance('2026-11-01',{className:'العاشر',period:'الأولى'})).data.records[0].status,'absent');
  assert.equal((await w.ApiService.getAttendance('2026-11-01',{className:'التاسع',period:'الأولى'})).data,null);
  env.load('services/leave-service.js');
  const request={id:'leave-test',teacherId:'teacher',teacherName:'معلم الاختبار',type:'contingent',status:'pending',startDate:'2026-11-01',endDate:'2026-11-01',reason:'اختبار المشاركة'};
  w.LeaveService.save([request]);
  assert.equal(w.LeaveService.list().length,1);
  w.AwnSession.set({username:'principal',role:'principal',name:'مدير الاختبار'});
  w.LeaveService.save([{...request,status:'approved',decisionNote:'موافق'}]);
  w.AwnSession.set({username:'teacher',role:'teacher'});
  assert.equal(w.LeaveService.list()[0].status,'approved');
  await w.AwnSession.login('student','123');
  assert.equal((await w.AssignmentService.list()).data.length,1);
  assert((await w.AssignmentService.setStatus(created.data.id,'completed')).success);
  assert.equal((await w.AssignmentService.create({title:'غير مسموح',subject:'الرياضيات',dueDate:'2026-11-01'})).success,false);
  assert.equal((await w.AttendanceService.save('2026-11-01',[])).success,false);
  assert.equal((await w.SchoolService.saveDailyPlan({})).success,false);
  assert.equal(w.LeaveService.list().length,0);
  assert.throws(()=>w.LeaveService.save([]),/FORBIDDEN/);
  assert.equal(w.AwnUtils.validDate('2026-02-30'),false);
  assert.equal(w.AwnUtils.validDate('2026-02-28'),true);
  assert(w.AwnUtils.csv([['=1+1','ع،و"ن']]).includes("'=1+1"));
  env.dom.window.close();
  console.log('PASS demo: sanitized sessions, disabled accounts, shared assignments/attendance, permissions, date validation, CSV safety');

  const calls=[];
  env=environment({api:'https://api.example.test',session:{username:'cached',role:'student'},fetcher:async(url,options)=>{
    calls.push({url,options});
    return {ok:true,status:200,json:async()=>({success:true,data:{username:'teacher',role:'teacher',name:'من الخادم',password:'never-cache'}})};
  }}); w=env.w; await w.AwnSession.ready;
  assert.equal(w.AwnSession.current().username,'teacher');
  assert(!w.localStorage.getItem('awn_session').includes('password'));
  assert(calls[0].url.endsWith('/api/auth/me'));
  await w.AwnHttp.request('/api/test',{method:'POST',body:'{}'});
  assert.equal(calls.at(-1).options.credentials,'include');
  assert.equal(calls.at(-1).options.headers.get('X-XSRF-TOKEN'),'test-token');
  w.fetch=async()=>({ok:true,status:200,json:async()=>({success:false,data:null,message:'رفض الخادم'})});
  await assert.rejects(w.AwnHttp.request('/api/test'),/رفض الخادم/);
  w.fetch=async()=>({ok:true,status:204});
  assert.deepEqual(plain(await w.AwnHttp.request('/api/test')),{success:true,data:null,message:''});
  w.fetch=async(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new w.DOMException('cancelled','AbortError'))));
  await assert.rejects(w.AwnHttp.request('/api/test',{timeoutMs:5}),error=>error.code === 'TIMEOUT');
  w.fetch=async()=>({ok:false,status:401,json:async()=>({message:'expired'})});
  await assert.rejects(w.AwnHttp.request('/api/test'));
  assert.equal(w.AwnSession.current(),null);
  assert.throws(()=>w.AwnDemo.write('awn_assignments',[]),/DEMO_STORAGE_DISABLED/);
  env.dom.window.close();
  console.log('PASS connected: server session validation, cookies, anti-forgery header, rejected envelopes, 204, expired sessions, no demo fallback');

  // A failed logout must not present a local-only deletion as a server logout.
  let navigationAttempted=false;
  env=environment({api:'https://api.example.test',fetcher:async(url)=>{
    if(String(url).endsWith('/api/auth/logout'))throw new Error('offline');
    return {ok:true,status:200,json:async()=>({success:true,data:{username:'teacher',role:'teacher'}})};
  }}); w=env.w; await w.AwnSession.ready;
  w.AwnUI={notify(){navigationAttempted=true;}};
  assert.equal(await w.AwnSession.logout(),false);
  assert(w.AwnSession.current()); assert(navigationAttempted);
  env.dom.window.close();
  console.log('PASS logout: network failure keeps session and reports failure');

  // No role page embeds a copied header or menu; all entries match real views.
  for(const role of ['admin','principal','supervisor','teacher','student','parent']){
    const html=fs.readFileSync(`awn/${role}-dashboard.html`,'utf8');
    const dom=new JSDOM(html,{url:`http://localhost/${role}-dashboard.html`,runScripts:'outside-only'}); const d=dom.window.document;
    assert.equal(d.querySelector('[data-app-sidebar]').children.length,0,`${role}: empty shared mount`);
    assert.equal(d.querySelector('[data-app-header]').children.length,0,`${role}: empty shared header mount`);
    dom.window.eval(fs.readFileSync('awn/js/config/roles.js','utf8'));
    for(const item of dom.window.AwnRoles.definitions[role].navigation){
      if(['view-feedback','view-about'].includes(item.id))continue;
      assert(d.getElementById(role==='admin'?'view-'+item.id:item.id),`${role}: ${item.id} exists`);
    }
    dom.window.close();
  }
  console.log('PASS shell: six role mounts, one renderer, and valid navigation targets');
})().catch(error=>{console.error(error);process.exitCode=1;});
