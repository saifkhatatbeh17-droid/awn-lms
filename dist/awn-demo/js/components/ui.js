/* Common controls and feedback. Domain features provide content, never their own dialog engine. */
(() => {
  function enhance(root = document) {
    root.querySelectorAll('[data-permission]').forEach((element) => { element.hidden=!AwnRoles.can(element.dataset.permission); });
    root.querySelectorAll('main input:not([type="checkbox"]):not([type="radio"]), main select, main textarea, dialog input, dialog select').forEach((el) => el.classList.add('awn-control'));
    root.querySelectorAll('main table').forEach((el) => el.classList.add('awn-table'));
    root.querySelectorAll('main button[type="submit"], .admin-primary-button, .admin-secondary-button').forEach((el) => el.classList.add('awn-button'));
  }
  function setBusy(button, busy) { button.disabled=busy; button.setAttribute('aria-busy',String(busy)); }
  function message(target, text, type = 'info') { target.textContent=text; target.classList.add('awn-message'); target.dataset.kind=type; target.setAttribute('role',type === 'error' ? 'alert' : 'status'); target.hidden=!text; }
  function empty(target, text = 'لا توجد بيانات لعرضها.') { target.replaceChildren(); const p=document.createElement('p'); p.className='awn-empty'; p.textContent=text; target.append(p); }
  async function dialog(options = {}) {
    if (window.Swal?.fire) return window.Swal.fire({ confirmButtonColor:'#7d2442', cancelButtonColor:'#76646c', ...options, customClass:{ popup:'awn-dialog', ...(options.customClass || {}) } });
    const modal=document.createElement('dialog'); modal.className='awn-native-dialog awn-dialog';
    const form=document.createElement('form'); form.method='dialog';
    const title=document.createElement('h2'); title.textContent=options.title || ''; title.id='awn-dialog-title'; modal.setAttribute('aria-labelledby',title.id); form.append(title);
    if (options.html) { const content=document.createElement('div'); content.innerHTML=options.html; form.append(content); }
    else if (options.text) { const p=document.createElement('p'); p.textContent=options.text; form.append(p); }
    let input;
    if (options.input) {
      const label=document.createElement('label'); label.textContent=options.inputLabel || options.title || '';
      input=document.createElement(options.input === 'textarea' ? 'textarea' : options.input === 'select' ? 'select' : 'input');
      if (options.input === 'select') Object.entries(options.inputOptions || {}).forEach(([value,text]) => { const option=document.createElement('option'); option.value=value; option.textContent=text; input.append(option); });
      else input.type=options.input === 'textarea' ? '' : options.input;
      input.value=options.inputValue || ''; input.placeholder=options.inputPlaceholder || ''; input.className='awn-control'; label.append(input); form.append(label);
    }
    const actions=document.createElement('div'); actions.className='awn-dialog-actions';
    const confirm=document.createElement('button'); confirm.type='submit'; confirm.className='awn-button'; confirm.textContent=options.confirmButtonText || 'حسنًا'; actions.append(confirm);
    if (options.showCancelButton) { const cancel=document.createElement('button'); cancel.type='button'; cancel.textContent=options.cancelButtonText || 'إلغاء'; cancel.className='awn-button'; cancel.addEventListener('click',()=>modal.close('cancel')); actions.append(cancel); }
    form.append(actions); modal.append(form); document.body.append(modal);
    return new Promise((resolve) => {
      let result={isConfirmed:false,isDismissed:true};
      form.addEventListener('submit',async (event) => { event.preventDefault(); if (!form.reportValidity()) return; const value=options.preConfirm ? await options.preConfirm(input?.value) : input?.value; if (value === false) return; result={isConfirmed:true,isDismissed:false,value}; modal.close('confirm'); });
      modal.addEventListener('close',()=>{ modal.remove(); resolve(result); },{once:true});
      modal.showModal();
      if (options.timer) setTimeout(()=>{ if (modal.isConnected) modal.close('timer'); },options.timer);
    });
  }
  function notify(text, type='info') { return dialog({ text, icon:type, confirmButtonText:'حسنًا' }); }
  window.AwnUI=Object.freeze({ enhance,setBusy,message,empty,dialog,notify });
  document.addEventListener('DOMContentLoaded',() => enhance());
})();
