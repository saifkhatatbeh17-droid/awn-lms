/* Local teacher messaging prototype; no delivery or read receipts are simulated. */
window.AwnMessages = (() => {
  const groups = {student:'الطلاب',parent:'الأهل',supervisor:'المشرف',principal:'المدير',office:'الإدارة العامة'};
  const contacts = [
    {id:'student-1',group:'student',name:'عمر خالد بني صخر',detail:'العاشر (أ) · طالب تجريبي'},
    {id:'student-2',group:'student',name:'أحمد إبراهيم العبادي',detail:'العاشر (أ) · طالب تجريبي'},
    {id:'parent-1',group:'parent',name:'خالد بني صخر',detail:'ولي أمر عمر · العاشر (أ)'},
    {id:'supervisor-1',group:'supervisor',name:'أ. خليل عبدالرحمن',detail:'الإشراف التربوي'},
    {id:'principal-1',group:'principal',name:'د. محمد القضاة',detail:'مدير المدرسة'},
    {id:'office-hr',group:'office',name:'شؤون الموظفين',detail:'العقود والإجازات والتجديد'},
    {id:'office-finance',group:'office',name:'الشؤون المالية',detail:'الرواتب والاقتطاعات'},
    {id:'office-affairs',group:'office',name:'شؤون الطلبة',detail:'المتابعة والسجلات المدرسية'}
  ];
  function key() {
    const user = AwnSession.current();
    if (user?.role !== 'teacher') throw new Error('غير مسموح');
    AwnDemo.assertEnabled();
    return 'awn_messages_v1_' + encodeURIComponent(user.username);
  }
  const read = () => AwnDemo.read(key(),{threads:[],draft:null});
  const write = value => AwnDemo.write(key(),value);
  function create(recipient, subject, topic, body) {
    if (!contacts.some(item=>item.id===recipient)) throw new Error('اختر مستلمًا من الدليل.');
    subject=String(subject).trim(); body=String(body).trim();
    if (!subject || subject.length>120 || !body || body.length>3000) throw new Error('أكمل الموضوع والرسالة ضمن الطول المسموح.');
    const store=read(), thread={id:crypto.randomUUID(),recipient,subject,topic:String(topic).slice(0,60),messages:[{text:body,at:new Date().toISOString()}]};
    store.threads.unshift(thread); store.draft=null; write(store); return thread.id;
  }
  function reply(id, body) {
    body=String(body).trim(); if (!body || body.length>3000) throw new Error('اكتب رسالة حتى 3000 حرف.');
    const store=read(), thread=store.threads.find(item=>item.id===id);
    if (!thread) throw new Error('المحادثة غير موجودة.');
    thread.messages.push({text:body,at:new Date().toISOString()}); write(store);
  }
  function draft(value) { const store=read(); store.draft=value; write(store); }
  return Object.freeze({groups,contacts,read,create,reply,draft});
})();
