'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve('awn');
(async()=>{
  for(const role of ['teacher','principal','supervisor','student','parent','admin']) {
    const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));vc.on('error',(...args)=>errors.push(args.join(' ')));
    let source=fs.readFileSync(`${root}/${role}-dashboard.html`,'utf8').replace('name="awn-demo-mode" content="false"','name="awn-demo-mode" content="true"');
    // Inline local classic scripts for a deterministic, offline page smoke test.
    // Native modules are evaluated below after their common dependencies exist.
    source=source.replace(/<script\b([^>]*?)src="([^"]+)"([^>]*)><\/script>/g,(_,before,url,after)=>{
      if(/^https?:/.test(url))return '';
      const file=path.resolve(root,url.split('?')[0]);
      assert(file.startsWith(root+path.sep)&&fs.existsSync(file),'Missing dependency '+url);
      if((before+after).includes('type="module"'))return '';
      const code=fs.readFileSync(file,'utf8').replace(/<\/script/gi,'<\\/script');
      return '<script>'+((before+after).includes('defer')?'document.addEventListener("DOMContentLoaded",()=>{'+code+'});':code)+'</script>';
    });
    const dom=new JSDOM(source,{url:`http://localhost/${role}-dashboard.html`,runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
      w.Headers=Headers;w.tailwind={};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
      w.localStorage.setItem('awn_session',JSON.stringify({username:role,role,name:'حساب الاختبار'}));
      w.fetch=async url=>({ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(path.join(root,new URL(url,'http://localhost/').pathname),'utf8'))});
      w.scrollTo=()=>{};
    }});
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(role+': load timeout')),5000);dom.window.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});});
    const w=dom.window;await w.AwnSession.ready;
    if(role==='admin'){
      w.eval(fs.readFileSync('awn/js/services/admin-service.js','utf8'));
      const script=fs.readFileSync('awn/js/features/admin-dashboard.js','utf8').replace(/^import .*;\r?\n/gm,'');
      await w.eval('(async()=>{'+script+'})()');
    }
    await new Promise(resolve=>setTimeout(resolve,50));
    assert.equal(errors.length,0,role+': '+errors.join('\n'));
    assert.equal(w.document.documentElement.dataset.authState,'ready',role+': session ready');
    assert.equal(w.document.querySelectorAll('[data-app-sidebar] .brand-symbol').length,1,role+': shared logo rendered');
    assert.equal(w.document.querySelectorAll('[data-app-header] [data-shell-search]').length,1,role+': shared header rendered');
    assert.equal(w.document.querySelectorAll('aside [aria-current="page"]').length,1,role+': one active page');
    console.log('PASS full page '+role+': scripts, initialization, session, shell and initial feature rendering');
    dom.window.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
