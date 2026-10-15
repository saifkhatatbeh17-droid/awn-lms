/**
 * Awn LMS - Smart School Operating System & E-Learning Platform
 * Standalone Premium SaaS Product Showcase Controller (Apple/Linear/Stripe Style)
 * 100% Dedicated to Awn Brand for Private Schools & Educational Institutions
 */

// ============================================================================
// 1. DASHBOARD BACKWARD COMPATIBILITY
// ============================================================================
const ABOUT_DEFAULTS = {
  schoolName: "منصة عون لإدارة المدارس والتعليم الذكي",
  contactEmail: "contact@awnlms.com",
  phone: "+962 7 9000 0000",
  description: "المنظومة السحابية المتكاملة لإدارة المدارس الحديثة والتعليم الإلكتروني الذكي.",
};

function ensureAboutView() {
  if (document.getElementById("view-about")) return;
  const main = document.querySelector("main");
  if (!main) return;

  const section = document.createElement("div");
  section.id = "view-about";
  section.className = "app-view hidden flex flex-col gap-6 w-full";
  section.innerHTML = `
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div id="about-view" class="flex flex-col gap-3"></div>
      <button type="button" id="about-edit-btn" class="mt-4 w-max px-5 py-2 rounded-lg border text-sm font-bold hover:bg-slate-50 transition-colors">تعديل البيانات</button>
    </div>
    <form id="about-form" class="hidden bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 gap-4">
      <input name="schoolName" placeholder="اسم المدرسة" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="اسم المدرسة">
      <input name="contactEmail" type="email" placeholder="البريد الإلكتروني" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="البريد الإلكتروني">
      <input name="phone" placeholder="رقم الهاتف" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="رقم الهاتف">
      <textarea name="description" rows="4" placeholder="نبذة عن المدرسة" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="نبذة عن المدرسة"></textarea>
      <div class="flex gap-2">
        <button type="submit" class="px-5 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">حفظ</button>
        <button type="button" id="about-cancel-btn" class="px-5 py-2 border rounded-lg text-sm hover:bg-slate-50 transition-colors">إلغاء</button>
      </div>
    </form>`;
  main.appendChild(section);
}

async function renderAbout() {
  const box = document.getElementById("about-view");
  if (!box) return;

  const res = typeof ApiService?.getAbout === "function" ? await ApiService.getAbout() : null;
  const a = { ...ABOUT_DEFAULTS, ...((res && res.success ? res.data : res) || {}) };

  box.innerHTML = "";
  const heading = document.createElement("h2");
  heading.className = "text-lg font-bold text-slate-900";
  heading.textContent = a.schoolName || ABOUT_DEFAULTS.schoolName;

  const desc = document.createElement("p");
  desc.className = "text-sm text-slate-600 leading-relaxed";
  desc.textContent = a.description || ABOUT_DEFAULTS.description;

  const email = document.createElement("p");
  email.className = "text-xs text-slate-500";
  email.textContent = "البريد: " + (a.contactEmail || "contact@awnlms.com");

  const phone = document.createElement("p");
  phone.className = "text-xs text-slate-500";
  phone.textContent = "الهاتف: " + (a.phone || "+962 7 9000 0000");

  box.appendChild(heading);
  box.appendChild(desc);
  box.appendChild(email);
  box.appendChild(phone);
}

async function openAboutForm(show) {
  const form = document.getElementById("about-form");
  if (!form) return;

  if (show) {
    const res = typeof ApiService?.getAbout === "function" ? await ApiService.getAbout() : null;
    const a = { ...ABOUT_DEFAULTS, ...((res && res.success ? res.data : res) || {}) };
    if (form.schoolName) form.schoolName.value = a.schoolName || "";
    if (form.contactEmail) form.contactEmail.value = a.contactEmail || "";
    if (form.phone) form.phone.value = a.phone || "";
    if (form.description) form.description.value = a.description || "";
  }

  form.classList.toggle("hidden", !show);
  document.getElementById("about-view")?.classList.toggle("hidden", show);
  document.getElementById("about-edit-btn")?.classList.toggle("hidden", show);
}


// ============================================================================
// 2. ELITE PRODUCT SAAS CONTROLLER (about.html)
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --------------------------------------------------------------------------
  // 1. High-Performance HTML5 Canvas Neural Network & Constellation Hero
  // --------------------------------------------------------------------------
  function initHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const hero = canvas.closest(".hero-canvas-section") || canvas.parentElement;

    let width = (canvas.width = hero.clientWidth);
    let height = (canvas.height = hero.clientHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resizeCanvas() {
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener("resize", () => {
      resizeCanvas();
    }, { passive: true });

    // Neural nodes colors representing Awn ecosystem intelligence
    const NODE_PALETTES = [
      { color: "#c6a15b", glow: "rgba(198, 161, 91, 0.8)", label: "ذكاء الإدارة" },
      { color: "#8a1538", glow: "rgba(138, 21, 56, 0.8)", label: "التعلم الذكي" },
      { color: "#10b981", glow: "rgba(16, 185, 129, 0.8)", label: "شراكة الأسرة" },
      { color: "#0284c7", glow: "rgba(2, 132, 199, 0.8)", label: "سحابة فائقة" },
      { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.8)", label: "تحليلات BI" },
    ];

    const particleCount = width < 640 ? 32 : width < 1024 ? 50 : 75;
    const maxLinkDist = width < 640 ? 100 : 140;
    const mouseRadius = width < 640 ? 120 : 180;

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const palette = NODE_PALETTES[i % NODE_PALETTES.length];
      const isHub = i < 6; // Major neural hubs
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isHub ? 0.35 : 0.55),
        vy: (Math.random() - 0.5) * (isHub ? 0.35 : 0.55),
        baseRadius: isHub ? (width < 640 ? 3.5 : 5) : (width < 640 ? 1.8 : 2.6),
        radius: isHub ? 5 : 2.6,
        palette: palette,
        isHub: isHub,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Mouse Tracking
    const mouse = {
      x: -9999,
      y: -9999,
      isOver: false,
      rippleRadius: 0,
      rippleMax: 160,
      rippleActive: false,
    };

    function updateMouse(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      mouse.isOver = true;
    }

    hero.addEventListener("mousemove", (e) => {
      updateMouse(e.clientX, e.clientY);
    }, { passive: true });

    hero.addEventListener("mouseleave", () => {
      mouse.isOver = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }, { passive: true });

    hero.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches[0]) {
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    hero.addEventListener("touchend", () => {
      mouse.isOver = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }, { passive: true });

    hero.addEventListener("click", (e) => {
      updateMouse(e.clientX, e.clientY);
      mouse.rippleRadius = 0;
      mouse.rippleActive = true;
    }, { passive: true });

    // Render loop
    let animationId = null;
    let isVisible = true;
    let time = 0;

    function render() {
      if (!isVisible) return;
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Draw click ripple wave
      if (mouse.rippleActive) {
        mouse.rippleRadius += 4;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.rippleRadius, 0, Math.PI * 2);
        const alpha = Math.max(0, 1 - mouse.rippleRadius / mouse.rippleMax) * 0.45;
        ctx.strokeStyle = `rgba(198, 161, 91, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (mouse.rippleRadius >= mouse.rippleMax) {
          mouse.rippleActive = false;
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 10) { p.x = 10; p.vx = Math.abs(p.vx); }
          else if (p.x > width - 10) { p.x = width - 10; p.vx = -Math.abs(p.vx); }
          if (p.y < 10) { p.y = 10; p.vy = Math.abs(p.vy); }
          else if (p.y > height - 10) { p.y = height - 10; p.vy = -Math.abs(p.vy); }

          // Magnetic interactive pull & gentle deflection
          if (mouse.isOver) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouseRadius && dist > 1) {
              const force = (1 - dist / mouseRadius) * 2.5;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }

          p.radius = p.baseRadius + Math.sin(time * 2 + p.pulseOffset) * (p.isHub ? 1.2 : 0.5);
        }

        // Draw node aura
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (p.isHub ? 2.6 : 2), 0, Math.PI * 2);
        ctx.fillStyle = p.palette.glow.replace("0.8", p.isHub ? "0.25" : "0.12");
        ctx.fill();

        // Draw node core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.palette.color;
        ctx.shadowColor = p.palette.color;
        ctx.shadowBlur = p.isHub ? 14 : 6;
        ctx.fill();
        ctx.restore();

        // Hub tag
        if (p.isHub && width > 768) {
          ctx.font = `600 11px Alexandria, system-ui, sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.textAlign = "center";
          ctx.fillText(p.palette.label, p.x, p.y + p.radius + 15);
        }
      }

      // Draw neural connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            const alpha = (1 - dist / maxLinkDist) * 0.28;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(198, 161, 91, ${alpha})`;
            ctx.lineWidth = p1.isHub || p2.isHub ? 1.2 : 0.8;
            ctx.stroke();
          }
        }

        // Connect cursor to closest nodes
        if (mouse.isOver) {
          const p = particles[i];
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const alpha = (1 - dist / mouseRadius) * 0.45;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(198, 161, 91, ${alpha})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
      }

      if (mouse.isOver && !prefersReducedMotion) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#c6a15b";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(render);
      }
    }

    // Auto pause when out of viewport for max 60fps performance
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion) {
            cancelAnimationFrame(animationId);
            animationId = requestAnimationFrame(render);
          }
        });
      }, { threshold: 0.05 });
      observer.observe(hero);
    }

    render();
  }


  // --------------------------------------------------------------------------
  // 2. Apple-Style 3D Perspective Tilt & Mouse Spotlight Engine
  // --------------------------------------------------------------------------
  function init3DTiltAndSpotlight() {
    const cards = document.querySelectorAll("[data-tilt], [data-spotlight], .bento-card, .hero-brand-card, .role-showcase-card, .metric-card");

    cards.forEach((card) => {
      card.style.setProperty("--mouse-x", `-999px`);
      card.style.setProperty("--mouse-y", `-999px`);

      let rafId = null;

      card.addEventListener("mousemove", (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          card.style.setProperty("--mouse-x", `${x}px`);
          card.style.setProperty("--mouse-y", `${y}px`);

          if (!prefersReducedMotion && (card.hasAttribute("data-tilt") || card.classList.contains("bento-card") || card.classList.contains("hero-brand-card"))) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const maxTilt = card.classList.contains("hero-brand-card") ? 5 : 7;

            const rotateX = ((y - centerY) / centerY) * -maxTilt;
            const rotateY = ((x - centerX) / centerX) * maxTilt;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
          }
        });
      }, { passive: true });

      card.addEventListener("mouseleave", () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.setProperty("--mouse-x", `-999px`);
        card.style.setProperty("--mouse-y", `-999px`);

        if (!prefersReducedMotion) {
          card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
        }
      }, { passive: true });
    });
  }


  // --------------------------------------------------------------------------
  // 3. Interactive 6-Role Ecosystem Switcher (Live Morphing Preview)
  // --------------------------------------------------------------------------
  const ROLES_DATA = {
    principal: {
      badge: "لوحة قيادة مدير المدرسة والقائد التربوي",
      title: "حوكمة مدرسية شاملة وقرارات استراتيجية بلحظة واحدة",
      desc: "تحكم كامل في الجداول المدرسية، أنصبة المعلمين، مؤشرات انضباط الدوام، وتصدير التقارير الرسمية بضغطة زر دون أي تعقيد أو هدر ورقي.",
      features: [
        "مولد جداول خوارزمي يوزع الحصص والأنصبة مع استبعاد أي تعارض",
        "لوحة متابعة فورية لنسب حضور المعلمين والطلبة ومؤشرات الانضباط",
        "اعتماد الخطط الدراسية، الإجازات، والمعاملات المدرسية إلكترونياً"
      ],
      user: {
        name: "د. طارق العساف",
        role: "المدير العام • مدارس الرواد الدولية",
        icon: "corporate_fare"
      },
      chips: [
        { val: "98.6%", lbl: "انضباط الكادر" },
        { val: "0", lbl: "تعارضات بالجداول" },
        { val: "920", lbl: "طالباً مسجلاً" }
      ],
      rows: [
        { title: "اعتماد جداول اختبارات نهاية الفصل", sub: "تم التحقق وتوزيع القاعات آلياً", status: "معتمد", statusClass: "verified" },
        { title: "تقرير التقييم المؤسسي للأقسام", sub: "أداء ممتاز وتغطية 100% للخطط", status: "مكتمل", statusClass: "active" }
      ],
      btnText: "الدخول كمدير مدرسة",
      btnUrl: "principal-dashboard.html"
    },
    supervisor: {
      badge: "منصة المشرف الأكاديمي وضبط الجودة",
      title: "توجيه تربوي معياري ورفع كفاءة التدريس الصفي",
      desc: "أدوات متطورة لتقييم الكفايات التدريسية، متابعة تطبيق استراتيجيات التعليم الحديثة، ورصد الفاقد التعليمي لضمان أعلى معايير الجودة الأكاديمية.",
      features: [
        "نماذج زيارات إشرافية رقمية مبنية على معايير الكفايات التربوية",
        "تحليل مستويات التحصيل الصفي ومعالجة الفجوات الأكاديمية مبكراً",
        "تنسيق خطط التطوير المهني وورش تدريب المعلمين تخصصياً"
      ],
      user: {
        name: "أ. ريم الشوابكة",
        role: "المشرفة الأكاديمية للعلوم • مدارس النهضة الحديثة",
        icon: "fact_check"
      },
      chips: [
        { val: "42", lbl: "زيارة منجزة" },
        { val: "97%", lbl: "جودة الخطط" },
        { val: "16", lbl: "ورشة تخصصية" }
      ],
      rows: [
        { title: "تقرير الزيارة الصفية: استراتيجيات التعلّم النشط", sub: "قسم الرياضيات • تقييم متميز", status: "معتمد", statusClass: "verified" },
        { title: "خطة التدخل العلاجي لمبحث الفيزياء", sub: "جاهزة للتطبيق ومتابعة الأثر", status: "نشط", statusClass: "active" }
      ],
      btnText: "الدخول كمشرف أكاديمي",
      btnUrl: "supervisor-dashboard.html"
    },
    teacher: {
      badge: "بيئة المعلم الذكية والتعليم المتمايز",
      title: "إدارة الصف والواجبات باحترافية تختصر 70% من وقتك",
      desc: "كل ما يحتاجه المعلم في مكان واحد: إعداد الخطط، رصد الحضور بنقرة، بنك أسئلة معياري، وتصحيح مؤتمت للواجبات مع تقديم تغذية راجعة فورية.",
      features: [
        "رصد مباشر وسريع للحضور والغياب والدرجات عبر الجوال أو الحاسوب",
        "بنك أسئلة واختبارات إلكترونية تدعم التصحيح التلقائي الفوري",
        "متابعة مسارات التعلّم المتمايز ومراعاة الفروق الفردية بين الطلبة"
      ],
      user: {
        name: "الأستاذ فراس الكيلاني",
        role: "معلم الرياضيات والفيزياء • الصفوف المتقدمة",
        icon: "school"
      },
      chips: [
        { val: "99%", lbl: "نسبة الالتزام" },
        { val: "3", lbl: "واجبات للتصحيح" },
        { val: "28", lbl: "طالباً متفوقاً" }
      ],
      rows: [
        { title: "واجب التفاضل والتطبيقات الحسابية", sub: "تم تسليم الحلول وتصحيح 26 طالباً آلياً", status: "نشط", statusClass: "active" },
        { title: "الخطة الفصلية لمبحث الرياضيات", sub: "تمت المصادقة من الإشراف الأكاديمي", status: "معتمد", statusClass: "verified" }
      ],
      btnText: "الدخول كمعلم",
      btnUrl: "teacher-dashboard.html"
    },
    student: {
      badge: "بوابة الطالب التفاعلية والشغف المعرفي",
      title: "تعلّم رقمي ممتع ومحفز ينمي مهارات المستقبل",
      desc: "واجهة عصرية مرنة تتيح للطالب متابعة واجباته، حل الاختبارات التفاعلية، استعراض المواد الإثرائية، ومعرفة درجاته وشارات تفوقه لحظة بلحظة.",
      features: [
        "لوحة إنجاز تعرض المعدل التراكمي، الواجبات القادمة، وشارات التميز",
        "تسليم رقمي منظم للمهام المدرسية وتلقي الملاحظات فور تصحيحها",
        "مستودع مصادر ثري بالفيديوهات والملخصات الداعمة للفهم والتعلم الذاتي"
      ],
      user: {
        name: "سند الحنيطي",
        role: "الصف الحادي عشر العلمي • القسم المتقدم",
        icon: "menu_book"
      },
      chips: [
        { val: "96.4%", lbl: "المعدل التراكمي" },
        { val: "1", lbl: "واجب للتسليم" },
        { val: "100%", lbl: "نسبة الحضور" }
      ],
      rows: [
        { title: "واجب الكيمياء: الروابط الجزيئية", sub: "الموعد النهائي: غداً الساعة 5 مساءً", status: "قيد الإنجاز", statusClass: "active" },
        { title: "شارة التفوق في مسابقة القراءة الإبداعية", sub: "تهنئة رسمية من إدارة المدرسة", status: "مكتمل", statusClass: "verified" }
      ],
      btnText: "الدخول كطالب",
      btnUrl: "student-dashboard.html"
    },
    parent: {
      badge: "تطبيق ولي الأمر وشراكة النجاح اللحظية",
      title: "اطمئنان دائم ومتابعة دقيقة لكل تفاصيل مسيرة أبنائك",
      desc: "إشعارات فورية تصل لهاتفك لحظة دخول وخروج الطالب، تقارير أداء دورية، وقناة تواصل رسمية راقية تضعك في قلب العملية التعليمية بثقة.",
      features: [
        "إشعارات حضور وغياب فورية ترسل لهاتفك مباشرة عبر التطبيق",
        "اطلاع لحظي على نتائج الاختبارات والواجبات والملاحظات السلوكية",
        "حجز مواعيد ومراسلة الكادر الإداري والتعليمي في أوقات الدوام الرسمية"
      ],
      user: {
        name: "م. إبراهيم الزعبي",
        role: "ولي أمر: ريان (الصف التاسع) وليان (الصف السادس)",
        icon: "family_restroom"
      },
      chips: [
        { val: "0", lbl: "غيابات غير مبررة" },
        { val: "4", lbl: "تقارير أسبوعية" },
        { val: "100%", lbl: "التواصل المدرسي" }
      ],
      rows: [
        { title: "إشعار حضور: تم تسجيل الدخول للمدرسة بانتظام", sub: "الحرم المدرسي • 7:45 صباحاً", status: "إشعار رسمي", statusClass: "verified" },
        { title: "نتيجة اختبار الأحياء الفصلي (ريان)", sub: "العلامة: 20/20 • أداء استثنائي", status: "ممتاز", statusClass: "active" }
      ],
      btnText: "الدخول كولي أمر",
      btnUrl: "parent-dashboard.html"
    },
    admin: {
      badge: "مركز القيادة والتحكم والأمن السحابي (Admin Hub)",
      title: "حوكمة تقنية متكاملة وأمان سحابي على مدار الساعة",
      desc: "تحكم مطلق في صلاحيات المستخدمين، إدارة البيانات المدرسية، النسخ الاحتياطي التلقائي، والربط البرمجي (API) مع الأنظمة المالية والمحاسبية.",
      features: [
        "إدارة دقيقة لأدوار وصلاحيات الكادر الإداري والتعليمي بنقرة زر",
        "تشفير سحابي متقدم للبيانات ونسخ احتياطي يومي يحمي أصول المدرسة",
        "سجلات تدقيق أمني (Audit Logs) ترصد كافة العمليات والأنشطة الرقمية"
      ],
      user: {
        name: "م. حسام التميمي",
        role: "مدير تكنولوجيا المعلومات والأنظمة السحابية",
        icon: "admin_panel_settings"
      },
      chips: [
        { val: "99.98%", lbl: "التوافر السحابي" },
        { val: "0", lbl: "ثغرات أمنية" },
        { val: "100%", lbl: "تشفير البيانات" }
      ],
      rows: [
        { title: "اكتمال النسخ الاحتياطي السحابي اليومي", sub: "تشفير AES-256 محلي وسحابي", status: "آمن", statusClass: "verified" },
        { title: "تحديث الصلاحيات السنوية للشعب الدراسية", sub: "مزامنة لحظية لكافة الفروع", status: "محدث", statusClass: "active" }
      ],
      btnText: "الدخول كمسؤول نظام",
      btnUrl: "admin-dashboard.html"
    }
  };

  function initRoleShowcase() {
    const tabBtns = document.querySelectorAll(".role-selector-btn");
    const showcaseCard = document.getElementById("roleShowcaseCard");
    if (!tabBtns.length || !showcaseCard) return;

    function switchRole(key) {
      const data = ROLES_DATA[key];
      if (!data) return;

      if (!prefersReducedMotion) {
        showcaseCard.classList.add("is-morphing");
      }

      setTimeout(() => {
        const badge = showcaseCard.querySelector(".showcase-badge");
        const title = showcaseCard.querySelector(".showcase-title");
        const desc = showcaseCard.querySelector(".showcase-desc");
        const features = showcaseCard.querySelector(".showcase-features");
        const btn = showcaseCard.querySelector(".showcase-cta-btn");
        const userName = showcaseCard.querySelector(".preview-user-name");
        const userRole = showcaseCard.querySelector(".preview-user-role");
        const userIcon = showcaseCard.querySelector(".preview-user-icon");
        const chips = showcaseCard.querySelector(".preview-chips-row");
        const rows = showcaseCard.querySelector(".preview-rows-list");

        if (badge) badge.textContent = data.badge;
        if (title) title.textContent = data.title;
        if (desc) desc.textContent = data.desc;

        if (btn) {
          btn.href = data.btnUrl || "index.html";
          btn.innerHTML = `<span>${data.btnText}</span><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>`;
        }

        if (features) {
          features.innerHTML = data.features.map(f => `
            <div class="showcase-feat-item">
              <span class="material-symbols-outlined feat-check" aria-hidden="true">verified</span>
              <span>${f}</span>
            </div>
          `).join("");
        }

        if (userName) userName.textContent = data.user.name;
        if (userRole) userRole.textContent = data.user.role;
        if (userIcon) userIcon.textContent = data.user.icon;

        if (chips) {
          chips.innerHTML = data.chips.map(c => `
            <div class="preview-chip">
              <span class="chip-num">${c.val}</span>
              <span class="chip-text">${c.lbl}</span>
            </div>
          `).join("");
        }

        if (rows) {
          rows.innerHTML = data.rows.map(r => `
            <div class="preview-mini-row">
              <span class="material-symbols-outlined row-bullet" aria-hidden="true">task_alt</span>
              <div class="mini-row-info">
                <span class="mini-row-title">${r.title}</span>
                <span class="mini-row-sub">${r.sub}</span>
              </div>
              <span class="mini-status-badge ${r.statusClass}">${r.status}</span>
            </div>
          `).join("");
        }

        if (!prefersReducedMotion) {
          showcaseCard.classList.remove("is-morphing");
        }
      }, prefersReducedMotion ? 0 : 180);
    }

    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        switchRole(btn.dataset.role);
      });
    });
  }


  // --------------------------------------------------------------------------
  // 4. Scroll-Driven Glowing Transformation Timeline
  // --------------------------------------------------------------------------
  function initTransformationTimeline() {
    const timeline = document.getElementById("transformationTimeline");
    const beam = document.getElementById("timelineBeam");
    const beamHead = document.getElementById("timelineBeamHead");
    const milestones = document.querySelectorAll(".timeline-step-item");

    if (!timeline || !beam || !milestones.length) return;

    let isUpdating = false;

    function onScrollTimeline() {
      const rect = timeline.getBoundingClientRect();
      const winH = window.innerHeight;

      const triggerStart = winH * 0.75;
      const scrollPassed = triggerStart - rect.top;
      const totalHeight = rect.height;

      let progress = Math.min(Math.max(scrollPassed / (totalHeight + winH * 0.2), 0), 1);
      const pct = (progress * 100).toFixed(1);

      beam.style.height = `${pct}%`;
      if (beamHead) {
        beamHead.style.top = `${pct}%`;
        beamHead.style.opacity = progress > 0.02 ? "1" : "0";
      }

      milestones.forEach(step => {
        const sRect = step.getBoundingClientRect();
        if (sRect.top <= winH * 0.68) {
          step.classList.add("is-active", "is-visible");
        } else {
          step.classList.remove("is-active");
        }
      });

      isUpdating = false;
    }

    window.addEventListener("scroll", () => {
      if (!isUpdating) {
        requestAnimationFrame(onScrollTimeline);
        isUpdating = true;
      }
    }, { passive: true });

    onScrollTimeline();
  }


  // --------------------------------------------------------------------------
  // 5. Animated ROI & Impact Metrics (IntersectionObserver)
  // --------------------------------------------------------------------------
  function initImpactCounters() {
    const counters = document.querySelectorAll(".metric-num-counter");
    if (!counters.length) return;

    function countUp(el) {
      const target = parseFloat(el.getAttribute("data-target")) || 0;
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = target * ease;

        if (target <= 100) {
          el.textContent = Math.round(current);
        } else {
          el.textContent = Math.round(current).toLocaleString("en-US");
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target.toLocaleString("en-US");
        }
      }

      requestAnimationFrame(update);
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      counters.forEach(c => observer.observe(c));
    } else {
      counters.forEach(c => countUp(c));
    }
  }


  // --------------------------------------------------------------------------
  // 6. High-Conversion School Demo Request Lead Form
  // --------------------------------------------------------------------------
  function initDemoForm() {
    const form = document.getElementById("schoolDemoForm");
    const successBox = document.getElementById("demoSuccessBox");
    const resetBtn = document.getElementById("resetDemoFormBtn");

    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined spin-icon" aria-hidden="true">sync</span><span>جاري تأكيد حجز العرض...</span>`;
      }

      const formData = new FormData(form);
      const lead = {
        schoolName: formData.get("schoolName") || "مدرسة نموذجية",
        contactPerson: formData.get("contactPerson") || "مدير المدرسة",
        phone: formData.get("phone") || "",
        email: formData.get("email") || "",
        studentCount: formData.get("studentCount") || "غير محدد",
        timestamp: new Date().toISOString()
      };

      try {
        const leads = JSON.parse(localStorage.getItem("awn_school_leads") || "[]");
        leads.push(lead);
        localStorage.setItem("awn_school_leads", JSON.stringify(leads));
      } catch (err) {
        console.warn("Could not save to localStorage:", err);
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }

        form.reset();
        form.classList.add("hidden");

        if (successBox) {
          successBox.classList.remove("hidden");
          const schoolTitle = successBox.querySelector(".confirmed-school-name");
          if (schoolTitle) schoolTitle.textContent = lead.schoolName;
        }
      }, 700);
    });

    if (resetBtn && form && successBox) {
      resetBtn.addEventListener("click", () => {
        successBox.classList.add("hidden");
        form.classList.remove("hidden");
      });
    }
  }


  // --------------------------------------------------------------------------
  // 7. Staggered Scroll Reveal Elements
  // --------------------------------------------------------------------------
  function initReveals() {
    const items = document.querySelectorAll(".fade-reveal-up, .bento-card, .metric-card");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(i => i.classList.add("is-inview"));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    items.forEach(i => observer.observe(i));
  }


  // --------------------------------------------------------------------------
  // 8. Sticky Navbar & Mobile Drawer Controls
  // --------------------------------------------------------------------------
  function initNavigation() {
    const navbar = document.getElementById("main-nav");
    const scrollProgressBar = document.getElementById("scrollProgressBar");
    const backToTopBtn = document.getElementById("backToTop");
    const mobileToggle = document.getElementById("mobileToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    const hideDelta = 8;

    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = docHeight > 0 ? currentScrollY / docHeight : 0;

      if (scrollProgressBar) {
        scrollProgressBar.style.width = `${scrollPercent * 100}%`;
      }

      if (backToTopBtn) {
        if (currentScrollY > 350) backToTopBtn.classList.add("visible");
        else backToTopBtn.classList.remove("visible");
      }

      if (navbar) {
        if (currentScrollY > 40) navbar.classList.add("scrolled");
        else navbar.classList.remove("scrolled");

        if (currentScrollY > 120) {
          if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > hideDelta) {
            navbar.classList.add("nav-hidden");
            if (mobileMenu && mobileMenu.classList.contains("is-open")) {
              closeMobileMenu();
            }
          } else if (lastScrollY > currentScrollY && lastScrollY - currentScrollY > hideDelta) {
            navbar.classList.remove("nav-hidden");
          }
        } else {
          navbar.classList.remove("nav-hidden");
        }
      }

      lastScrollY = Math.max(0, currentScrollY);
    }, { passive: true });

    if (backToTopBtn) {
      backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    function closeMobileMenu() {
      if (!mobileMenu || !mobileToggle) return;
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
      mobileMenu.hidden = true;
      const icon = mobileToggle.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = "menu";
    }

    function openMobileMenu() {
      if (!mobileMenu || !mobileToggle) return;
      mobileToggle.setAttribute("aria-expanded", "true");
      mobileMenu.classList.add("is-open");
      mobileMenu.hidden = false;
      const icon = mobileToggle.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = "close";
    }

    if (mobileToggle && mobileMenu) {
      closeMobileMenu();

      mobileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (mobileMenu.classList.contains("is-open")) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });

      mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => closeMobileMenu());
      });

      document.addEventListener("click", (e) => {
        if (mobileMenu.classList.contains("is-open") && !mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
          closeMobileMenu();
        }
      });
    }
  }


  // --------------------------------------------------------------------------
  // INITIALIZE ALL
  // --------------------------------------------------------------------------
  initHeroCanvas();
  init3DTiltAndSpotlight();
  initRoleShowcase();
  initTransformationTimeline();
  initImpactCounters();
  initDemoForm();
  initReveals();
  initNavigation();
});
