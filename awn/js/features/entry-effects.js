/* Ambient motion stays away from input targets and pauses while the user types. */
(() => {
  const scene=document.querySelector('.login-page__main');
  const toggle=document.querySelector('[data-entry-motion]');
  if (!scene || !toggle) return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  let enabled=!reduced.matches;
  let frame=0;
  let pointer={x:.5,y:.5};

  function labels() {
    const english=document.documentElement.lang === 'en';
    const text=reduced.matches ? (english ? 'Reduced motion' : 'حركة مخفّضة') : enabled ? (english ? 'Pause motion' : 'إيقاف الحركة') : (english ? 'Resume motion' : 'تشغيل الحركة');
    toggle.querySelector('[data-motion-label]').textContent=text;
    toggle.setAttribute('aria-label',text);
    toggle.setAttribute('aria-pressed',String(!enabled));
    toggle.disabled=reduced.matches;
    toggle.querySelector('path').setAttribute('d',enabled ? 'M7 5v10m6-10v10' : 'm7 4 8 6-8 6Z');
  }
  function resetPointer() {
    cancelAnimationFrame(frame); frame=0;
    scene.style.setProperty('--scene-x','0px');
    scene.style.setProperty('--scene-y','0px');
    scene.style.setProperty('--light-x','50%');
    scene.style.setProperty('--light-y','50%');
  }
  function update() { document.body.dataset.motion=enabled ? 'on' : 'off'; if (!enabled) resetPointer(); labels(); }
  toggle.addEventListener('click',()=>{ if (reduced.matches) return; enabled=!enabled; update(); });
  reduced.addEventListener('change',()=>{ enabled=!reduced.matches; update(); });
  finePointer.addEventListener('change',resetPointer);
  scene.addEventListener('pointermove',(event)=>{
    if (!enabled || !finePointer.matches || document.body.hasAttribute('data-input-active')) return;
    const rect=scene.getBoundingClientRect();
    pointer={x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};
    if (frame) return;
    frame=requestAnimationFrame(()=>{
      scene.style.setProperty('--scene-x',((pointer.x-.5)*14).toFixed(2)+'px');
      scene.style.setProperty('--scene-y',((pointer.y-.5)*10).toFixed(2)+'px');
      scene.style.setProperty('--light-x',(pointer.x*100).toFixed(1)+'%');
      scene.style.setProperty('--light-y',(pointer.y*100).toFixed(1)+'%');
      frame=0;
    });
  },{passive:true});
  scene.addEventListener('pointerleave',resetPointer);
  scene.addEventListener('focusin',(event)=>{
    if (!event.target.matches('input')) return;
    document.body.setAttribute('data-input-active',''); resetPointer();
  });
  scene.addEventListener('focusout',()=>queueMicrotask(()=>{ if (!scene.querySelector('input:focus')) document.body.removeAttribute('data-input-active'); }));
  document.addEventListener('visibilitychange',()=>{ document.body.toggleAttribute('data-page-hidden',document.hidden); if (document.hidden) resetPointer(); });
  new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  update();
})();
