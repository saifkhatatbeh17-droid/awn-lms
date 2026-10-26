(() => {
  const daily=document.getElementById('view-daily-plans');
  if(!daily)return;
  const icon=`<span class="awn-help-symbol" aria-hidden="true">${AwnBrand.symbol()}<svg class="awn-help-spark" viewBox="0 0 20 20" fill="none"><path d="M10 2 12 8 18 10 12 12 10 18 8 12 2 10 8 8Z" fill="currentColor"/></svg></span>`;
  const trigger=document.createElement('button');trigger.type='button';trigger.id='awn-help-trigger';trigger.className='awn-help-trigger no-print';trigger.setAttribute('aria-haspopup','dialog');
  trigger.innerHTML=`${icon}<span><strong>عَونك</strong><small>مساعدك في تحضير الدرس</small></span><span class="awn-help-arrow" aria-hidden="true">↗</span>`;
  daily.querySelector('.plan-mode-bar').before(trigger);
  const panel=document.createElement('dialog');panel.id='awn-help-panel';panel.className='awn-help-panel no-print';panel.setAttribute('aria-labelledby','awn-help-title');
  panel.innerHTML=`<div class="awn-help-header"><div>${icon}<div><h2 id="awn-help-title">عَونك</h2><p>فكرة تُعينك. والقرار لك.</p></div></div><button type="button" data-help-close aria-label="إغلاق مساعد عونك">×</button></div><div class="awn-help-scroll"><p class="awn-help-mode">تجربة محلية بقوالب تربوية · خدمة الذكاء الاصطناعي غير متصلة.</p><div class="awn-help-context"><span>نعمل على خطتك اليومية</span><strong id="awn-help-topic"></strong><small>تُستخدم بيانات الدرس فقط، دون بيانات الطلبة أو ملفك المالي.</small></div><h3>بماذا أعينك؟</h3><div class="awn-help-actions"><button type="button" data-help-action="activity" aria-pressed="true"><strong>اقترح نشاطًا</strong><span>فكرة قابلة للتطبيق في مرحلة الدرس</span></button><button type="button" data-help-action="adapt" aria-pressed="false"><strong>كيّف النشاط</strong><span>دعم وممارسة وامتداد لنفس النتاج</span></button><button type="button" data-help-action="review" aria-pressed="false"><strong>راجع اكتمال الخطة</strong><span>اكشف الحقول والمراحل الناقصة</span></button></div><label class="awn-help-stage">مرحلة الدرس<select id="awn-help-stage"><option value="0">التهيئة والاندماج</option><option value="1">الشرح والتفسير</option><option value="2">التوسع ودعم التميز</option><option value="3">تأكيد التعلم</option></select></label><button type="button" id="awn-help-generate" class="awn-help-primary">جهّز الاقتراح</button><p id="awn-help-status" role="status" aria-live="polite"></p><section id="awn-help-result" hidden><div class="awn-help-result-title"><h3>مسودة مقترحة</h3><span>راجعها وعدّلها</span></div><div id="awn-help-review" hidden></div><div id="awn-help-edit"><label>دور المعلّم<textarea id="awn-help-teacher" rows="6" maxlength="6000"></textarea></label><label>دور المتعلّم<textarea id="awn-help-learner" rows="4" maxlength="6000"></textarea></label><p class="awn-help-hint">اقتراح تنظيمي عام؛ راجع المحتوى مع كتاب الدرس وحدّد الزمن المناسب.</p><button type="button" id="awn-help-apply" class="awn-help-primary">إضافة إلى المرحلة المحددة</button></div></section><button type="button" id="awn-help-undo" hidden>تراجع عن آخر إدراج</button></div>`;
  document.body.append(panel);
  let action='activity',suggestion=null,undo=null;
  const status=text=>{panel.querySelector('#awn-help-status').textContent=text;};
  const context=()=>({subject:document.getElementById('subjectField').value.trim(),topic:document.getElementById('lessonTopicField').value.trim(),outcome:document.getElementById('outcomesField').value.trim(),stage:panel.querySelector('#awn-help-stage').value,stages:[...document.querySelectorAll('#daily-stages tbody tr')].map(row=>{const f=row.querySelectorAll('textarea,input');return {teacher:f[0].value,learner:f[1].value,time:f[2].value};})});
  const reset=()=>{suggestion=null;panel.querySelector('#awn-help-result').hidden=true;};
  trigger.addEventListener('click',event=>{event.stopPropagation();panel.querySelector('#awn-help-topic').textContent=context().topic||'أضف موضوع الدرس والنتاجات في الخطة للبدء';reset();status('');panel.showModal();});
  panel.addEventListener('click',event=>{
    event.stopPropagation();const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-help-close'))panel.close();
    if(button.dataset.helpAction){action=button.dataset.helpAction;panel.querySelectorAll('[data-help-action]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.helpAction===action)));panel.querySelector('.awn-help-stage').hidden=action==='review';reset();status('');}
    if(button.id==='awn-help-generate'){
      try{
        const snapshot=context(),result=AwnTeacherAssistant.suggest(action,snapshot);suggestion={snapshot};
        panel.querySelector('#awn-help-result').hidden=false;
        panel.querySelector('#awn-help-edit').hidden=Boolean(result.review);
        const review=panel.querySelector('#awn-help-review');review.hidden=!result.review;review.replaceChildren();
        if(result.review){result.review.forEach(text=>{const p=document.createElement('p');p.textContent=text;review.append(p);});status('فحص محلي للاكتمال؛ لا يقيّم صحة المحتوى أو جودة الخطة.');}
        else{panel.querySelector('#awn-help-teacher').value=result.teacher;panel.querySelector('#awn-help-learner').value=result.learner;status('الاقتراح جاهز للمراجعة. لم تتغير خطتك.');}
      }catch(error){reset();status(error.message);}
    }
    if(button.id==='awn-help-apply'&&suggestion){
      const now=context(),before=suggestion.snapshot;
      if(now.topic!==before.topic||now.outcome!==before.outcome||now.subject!==before.subject){reset();status('تغيّرت بيانات الدرس. جهّز اقتراحًا جديدًا قبل الإدراج.');return;}
      const row=document.querySelectorAll('#daily-stages tbody tr')[Number(before.stage)],fields=[...row.querySelectorAll('textarea')];
      const text=[panel.querySelector('#awn-help-teacher').value.trim(),panel.querySelector('#awn-help-learner').value.trim()];
      if(text.some(value=>!value)){status('أكمل دور المعلّم والمتعلّم قبل الإدراج.');return;}
      undo=fields.map((field,index)=>({field,before:field.value,after:field.value.trim()?field.value+'\n\n'+text[index]:text[index]}));
      undo.forEach(item=>{item.field.value=item.after;item.field.dispatchEvent(new Event('input',{bubbles:true}));});
      panel.querySelector('#awn-help-undo').hidden=false;reset();status('أُضيف الاقتراح إلى المرحلة دون حذف النص الموجود. يمكنك التراجع.');
    }
    if(button.id==='awn-help-undo'&&undo){
      if(undo.some(item=>item.field.value!==item.after)){status('عدّلت النص بعد الإدراج. راجعه يدويًا حتى لا نفقد تعديلاتك.');return;}
      undo.forEach(item=>{item.field.value=item.before;item.field.dispatchEvent(new Event('input',{bubbles:true}));});undo=null;button.hidden=true;status('تم التراجع عن آخر إدراج.');
    }
  });
  panel.querySelector('#awn-help-stage').addEventListener('change',()=>{reset();status('');});
  panel.addEventListener('close',()=>trigger.focus());
})();
