/* Local scaffolds only. A model provider must be integrated server-side later. */
window.AwnTeacherAssistant = (() => {
  function suggest(action, context) {
    if (action === 'review') {
      const checks=[];
      if (!context.subject) checks.push('أضف المبحث لتوضيح سياق الخطة.');
      if (!context.topic) checks.push('حدّد موضوع الدرس.');
      if (!context.outcome) checks.push('اكتب نتاجًا تعليميًا يمكن ملاحظته أو تقويمه.');
      context.stages.forEach((stage,index)=>{
        if(!stage.teacher.trim())checks.push(`المرحلة ${index+1}: أضف دور المعلّم.`);
        if(!stage.learner.trim())checks.push(`المرحلة ${index+1}: أضف دور المتعلّم.`);
        if(!stage.time.trim())checks.push(`المرحلة ${index+1}: حدّد الزمن.`);
      });
      return {review:checks.length?checks:['الحقول الأساسية مكتملة. راجع بنفسك ارتباط الأنشطة بالنتاجات وصحة المحتوى وتناسب الزمن.']};
    }
    if (!context.topic || !context.outcome) throw new Error('أضف موضوع الدرس والنتاجات التعليمية في الخطة أولًا.');
    const outcome=context.outcome.split('\n').find(line=>line.trim())?.trim();
    const topic=context.topic;
    if(action==='adapt') return {
      teacher:`لنتاج: ${outcome}\n• دعم إضافي: قدّم نموذجًا محلولًا أو مثالًا موجّهًا حول «${topic}»، ثم خفّف المساعدة تدريجيًا.\n• ممارسة مستقلة: اطلب تطبيق النتاج على مثال جديد من مادة الدرس.\n• امتداد: اطلب تفسير طريقة الحل أو مقارنة مثالين مع تبرير الاختيار.\nاختر مستوى الدعم بناءً على استجابة الطالب، واسمح بالانتقال بين الأنشطة.`,
      learner:`أطبّق المهمة المرتبطة بالنتاج: ${outcome}\nأستخدم نموذجًا أو تلميحًا عند الحاجة، ثم أوضّح إجابتي أو طريقتي لزميل.\nأراجع عملي وفق معيار النجاح الذي يحدده المعلّم.`
    };
    const teacher=[
      `اعرض سؤالًا أو موقفًا قصيرًا مرتبطًا بـ «${topic}» من مادة الدرس. امنح الطلبة وقتًا للتفكير الفردي، ثم ناقش إجابات ثنائية للكشف عن التعلم القبلي. اربط النقاش بالنتاج: ${outcome}`,
      `قدّم مثالًا من مادة الدرس حول «${topic}»، وفكّر بصوت مسموع أثناء شرحه. اطلب من الطلبة تفسير خطوة أو فكرة، ثم قدّم سؤال تحقق مرتبطًا بالنتاج: ${outcome}`,
      `قدّم مهمة تطبيقية جديدة حول «${topic}» من مصادر الدرس. اطلب من المجموعات تبرير اختياراتها، مع إتاحة تلميحات للدعم ومهمة إضافية للتعمق. راقب تحقق النتاج: ${outcome}`,
      `استخدم بطاقة خروج قصيرة مرتبطة بالنتاج: ${outcome}\nحدّد سؤالًا أو أداءً يمكن ملاحظته من مادة الدرس. راجع الإجابات لتحديد من يحتاج دعمًا في الحصة التالية.`
    ];
    const learner=[
      'أفكّر فرديًا، ثم أشارك زميلًا بإجابتي، وأوضح ما أعرفه وما أحتاج إلى تعلمه.',
      'ألاحظ المثال، وأفسّر الفكرة بلغتي، ثم أحل سؤال التحقق وأناقش التغذية الراجعة.',
      'أطبّق التعلم في المهمة الجديدة، وأشرح مبرراتي وأقارن طريقتي مع زملائي.',
      'أنجز بطاقة الخروج بصورة فردية، وأحدد نقطة أتقنتها وسؤالًا ما زلت أحتاج إلى توضيحه.'
    ];
    const index=Math.max(0,Math.min(3,Number(context.stage)||0));
    return {teacher:teacher[index],learner:learner[index]};
  }
  return Object.freeze({suggest,mode:'local'});
})();
