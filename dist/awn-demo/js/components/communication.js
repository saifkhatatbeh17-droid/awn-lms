window.AwnCommunication = (() => {
  let view, active=null, channel='all', query='';
  const safe = value=>AwnUtils.escapeHtml(String(value ?? ''));
  const contact = id=>AwnMessages.contacts.find(item=>item.id===id);
  const time = value=>new Intl.DateTimeFormat('ar-JO',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Amman'}).format(new Date(value));
  function notice(text,error=false) { const node=view.querySelector('#com-status'); node.textContent=text; node.dataset.error=String(error); }
  function list() {
    const threads=AwnMessages.read().threads;
    const filtered=threads.filter(thread=>{
      const user=contact(thread.recipient);
      return (channel==='all'||user?.group===channel) && `${user?.name} ${thread.subject} ${thread.messages.map(item=>item.text).join(' ')}`.includes(query);
    });
    view.querySelector('#com-count').textContent=filtered.length+' محادثة';
    view.querySelector('#com-list').innerHTML=filtered.length ? filtered.map(thread=>{
      const user=contact(thread.recipient), last=thread.messages.at(-1);
      return `<button type="button" class="com-thread" data-thread="${safe(thread.id)}" aria-pressed="${active===thread.id}"><span class="com-avatar" aria-hidden="true">${safe(user?.name.charAt(0))}</span><span><strong>${safe(user?.name)}</strong><b>${safe(thread.subject)}</b><small>${safe(last.text.slice(0,65))}</small><em>محفوظ محليًا · لم يُرسل</em></span></button>`;
    }).join('') : '<div class="com-empty"><strong>لا توجد محادثات هنا بعد</strong><p>ابدأ رسالة وحدّد المستلم والموضوع، لتبقى المتابعة في مكان واحد.</p></div>';
  }
  function open(id) {
    const thread=AwnMessages.read().threads.find(item=>item.id===id); if(!thread)return;
    active=id; view.querySelector('#com-compose').hidden=true;
    const user=contact(thread.recipient), detail=view.querySelector('#com-detail'); detail.hidden=false;
    detail.innerHTML=`<div class="com-detail-heading"><div><span>${safe(AwnMessages.groups[user.group])} · ${safe(user.detail)}</span><h2>${safe(user.name)}</h2><p>${safe(thread.subject)} <small>· ${safe(thread.topic)}</small></p></div><span class="com-tag">لم يُرسل</span></div><div class="com-messages">${thread.messages.map(item=>`<article class="com-bubble"><span>أنت · ${safe(time(item.at))}</span><p>${safe(item.text)}</p><small>محفوظ محليًا — لم يصل إلى المستلم</small></article>`).join('')}</div><form id="com-reply"><label for="com-reply-body">متابعة الموضوع</label><textarea id="com-reply-body" name="body" required maxlength="3000" rows="3" placeholder="أضف متابعة لهذه المحادثة…"></textarea><button type="submit" class="com-primary">حفظ المتابعة محليًا</button></form>`;
    list();
  }
  function recipients(value='') {
    const group=view.querySelector('#com-audience').value;
    const people=AwnMessages.contacts.filter(item=>item.group===group);
    view.querySelector('#com-recipient').innerHTML='<option value="">اختر المستلم بالاسم أو القسم</option>'+people.map(item=>`<option value="${safe(item.id)}">${safe(item.name)} — ${safe(item.detail)}</option>`).join('');
    view.querySelector('#com-recipient').value=value;
  }
  function compose() {
    active=null; list(); view.querySelector('#com-detail').hidden=true;
    const form=view.querySelector('#com-compose'); form.hidden=false;
    const saved=AwnMessages.read().draft;
    if(saved) {
      form.elements.audience.value=saved.audience; recipients(saved.recipient);
      ['subject','topic','body'].forEach(name=>form.elements[name].value=saved[name]||'');
    } else { form.reset(); recipients(); }
    view.querySelector('#com-audience').focus();
  }
  function mount() {
    if(document.getElementById('view-feedback'))return;
    view=document.createElement('section');view.id='view-feedback';view.className='app-view hidden communication-view';
    document.querySelector('main').append(view);
    view.innerHTML=`<div class="com-heading"><div><span>كلّ محادثة، في مكانها.</span><h1>مركز التواصل</h1><p>تواصل مع الطالب وأسرته، وفريق مدرستك، دون تشتّت.</p></div><button type="button" id="com-new" class="com-primary">＋ رسالة جديدة</button></div><p class="com-demo">نموذج محلي: المستلمون تجريبيون. الرسائل تُحفظ في هذا المتصفح فقط ولا تُرسل لأي شخص.</p><p id="com-status" role="status" aria-live="polite"></p>`;
    if(!AwnDemo.enabled()) {
      view.querySelector('.com-demo').textContent='لم يُربط مركز التواصل بخدمة الرسائل بعد.';
      view.querySelector('#com-new').disabled=true;
      view.insertAdjacentHTML('beforeend','<div class="com-empty">ستظهر المحادثات والمستلمون بعد تفعيل الخدمة من المدرسة.</div>');return;
    }
    view.insertAdjacentHTML('beforeend',`<div class="com-channels" role="group" aria-label="تصفية حسب جهة التواصل"><button type="button" data-channel="all" aria-pressed="true">الكل</button>${Object.entries(AwnMessages.groups).map(([id,label])=>`<button type="button" data-channel="${id}" aria-pressed="false">${label}</button>`).join('')}</div><div class="com-workspace"><section class="com-inbox" aria-label="المحادثات"><div class="com-inbox-heading"><strong>المحادثات</strong><small id="com-count"></small></div><label class="com-search">ابحث في المحادثات<input id="com-search" type="search" placeholder="اسم أو موضوع أو نص الرسالة"></label><div id="com-list"></div></section><div class="com-reader"><div id="com-detail"><div class="com-empty"><span class="com-empty-icon" aria-hidden="true">↗</span><h2>المستلم المناسب، للموضوع المناسب.</h2><p>الطالب للمتابعة الدراسية، الأهل للتنسيق، المشرف للدعم التربوي، والإدارة للشؤون الوظيفية.</p><p>اختر محادثة أو ابدأ رسالة جديدة.</p></div></div><form id="com-compose" hidden><div class="com-detail-heading"><div><span>محادثة جديدة</span><h2>إلى مَن تريد أن تكتب؟</h2></div><button type="button" id="com-close">حفظ المسودة وإغلاق</button></div><div class="com-form-grid"><label>جهة التواصل<select id="com-audience" name="audience">${Object.entries(AwnMessages.groups).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><label>المستلم<select id="com-recipient" name="recipient" required></select></label><label>موضوع الرسالة<input name="subject" maxlength="120" required placeholder="مثال: متابعة واجب اللغة العربية"></label><label>نوع المتابعة<select name="topic"><option>متابعة دراسية</option><option>حضور وسلوك</option><option>موعد لقاء</option><option>دعم تربوي</option><option>شؤون وظيفية</option><option>رواتب ومستحقات</option><option>أخرى</option></select></label><label class="com-full">نص الرسالة<textarea name="body" rows="6" maxlength="3000" required placeholder="وضّح الموضوع وما تحتاج متابعته…"></textarea></label></div><div class="com-compose-footer"><small>ستُحفظ كرسالة محلية غير مرسلة.</small><button type="submit" class="com-primary">حفظ الرسالة محليًا</button></div></form></div></div>`);
    recipients(); list();
    // Own events stay within this view; the dashboard fallback must not treat them as unavailable actions.
    view.addEventListener('click',event=>{
      const button=event.target.closest('button'); if(!button)return;event.stopPropagation();
      try {
        if(button.id==='com-new')compose();
        if(button.dataset.channel){channel=button.dataset.channel;view.querySelectorAll('[data-channel]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.channel===channel)));list();}
        if(button.dataset.thread)open(button.dataset.thread);
        if(button.id==='com-close'){saveDraft();view.querySelector('#com-compose').hidden=true;view.querySelector('#com-detail').hidden=false;const recent=AwnMessages.read().threads[0];if(recent)open(recent.id);notice('حُفظت المسودة محليًا.');view.querySelector('#com-new').focus();}
      } catch(error){notice(error.message,true);}
    });
    function saveDraft(){const form=view.querySelector('#com-compose');AwnMessages.draft(Object.fromEntries(new FormData(form)));}
    view.addEventListener('change',event=>{if(event.target.id==='com-audience')recipients();if(event.target.closest('#com-compose')){try{saveDraft();}catch(error){notice('تعذّر حفظ المسودة في المتصفح.',true);}}});
    view.addEventListener('input',event=>{
      if(event.target.id==='com-search'){query=event.target.value.trim();list();}
      if(event.target.closest('#com-compose')){try{saveDraft();}catch(error){notice('تعذّر حفظ المسودة في المتصفح.',true);}}
    });
    view.addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();
      try {
        const form=event.target;
        if(form.id==='com-compose') {const values=Object.fromEntries(new FormData(form));const id=AwnMessages.create(values.recipient,values.subject,values.topic,values.body);channel='all';query='';view.querySelector('#com-search').value='';view.querySelectorAll('[data-channel]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.channel==='all')));open(id);}
        else if(form.id==='com-reply'){AwnMessages.reply(active,form.elements.body.value);open(active);}
        notice('حُفظت الرسالة محليًا؛ لم تُرسل إلى المستلم.');
      }catch(error){notice(error.message,true);}
    });
  }
  return {mount};
})();
