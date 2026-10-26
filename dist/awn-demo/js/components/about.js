/**
 * Awn LMS - About Page Interactive Showcase Controller
 * Handles role tab switching,
 * school brand stationery theme preview, mobile navigation, and demo form.
 */

// ============================================================================
// 1. DASHBOARD BACKWARD COMPATIBILITY
// ============================================================================
const ABOUT_DEFAULTS = {
  schoolName: "منصة عون لإدارة المدارس والتعليم الذكي",
  contactEmail: "",
  phone: "",
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
      <button type="button" id="about-edit-btn" data-permission="about:write" class="mt-4 w-max px-5 py-2 rounded-lg border text-sm font-bold hover:bg-slate-50 transition-colors">تعديل البيانات</button>
    </div>
    <form id="about-form" data-permission="about:write" class="hidden bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 gap-4">
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
  email.textContent = "البريد: " + (a.contactEmail || "غير محدد");

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
// 2. ABOUT PAGE INTERACTIVE CONTROLLER
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // --------------------------------------------------------------------------
  // A. Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (menuToggle && mobileNav) {
    function toggleMobileMenu(open) {
      const isOpen = open !== undefined ? open : mobileNav.hidden;
      mobileNav.hidden = !isOpen;
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
    }

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => toggleMobileMenu(false));
    });

    document.addEventListener("click", (e) => {
      if (!mobileNav.hidden && !mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
        toggleMobileMenu(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !mobileNav.hidden) {
        toggleMobileMenu(false);
        menuToggle.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // The hero is intentionally static: its content stays readable without motion.

  // C. Interactive Roles Showcase Tabs
  // --------------------------------------------------------------------------
  const ROLES_DATA = {
    teacher: {
      title: "مساحة أوسع للتعليم.",
      description: "خطّط للدرس، تابع حضور طلبتك، وأعطِ كل تسليم ملاحظته. أدوات يومك قريبة، والسياق واضح من التحضير إلى التقييم.",
      features: [
        "خطط دروس محفوظة ومراجعات واضحة",
        "واجبات وتسليمات في مسار واحد",
        "علامات وتغذية راجعة لكل طالب",
      ],
      previewRole: "مساحة المعلم",
      previewGreeting: "يوم تعلّم جديد.",
      previewTitle: "من التحضير إلى الأثر",
      previewFootnote: "السياق حاضر: الشعبة، المبحث، والفصل.",
      rows: [
        { icon: "#icon-book", title: "خطة درس: الفكرة الرئيسة", sub: "اللغة العربية · العاشر", status: "مسودة" },
        { icon: "#icon-check", title: "التسليمات بانتظارك", sub: "قراءة الإجابات وكتابة الملاحظات", status: "للمراجعة" },
        { icon: "#icon-book", title: "سجل العلامات", sub: "رصد واضح، ثم اعتماد ونشر", status: "متابعة" },
      ],
    },
    principal: {
      title: "الصورة الكاملة لمدرستك.",
      description: "اطّلع على سير الدوام، اعتمد الخطط والعلامات قبل نشرها، وتابع الزيارات والتعاميم في بيئة مدرسية متماسكة.",
      features: [
        "اعتماد ومراجعة سجلات العلامات",
        "متابعة حضور الكادر وانضباط الشعب",
        "تعاميم مدرسية وتواصل مؤسسي مباشر",
      ],
      previewRole: "لوحة المدير",
      previewGreeting: "نظرة شاملة على اليوم الدراسي.",
      previewTitle: "القرارات والاعتمادات",
      previewFootnote: "حوكمة دقيقة لحركة المدرسة اليومية.",
      rows: [
        { icon: "#icon-check", title: "اعتماد نتائج الفصل الأول", sub: "الصف العاشر أ · اللغة العربية", status: "جاهز للنشر" },
        { icon: "#icon-book", title: "الخطة الأسبوعية المجمعة", sub: "مراجعة خطط الأسبوع القادم", status: "معتمدة" },
        { icon: "#icon-star", title: "تعميم داخلي للكادر", sub: "الاستعداد للاختبارات الشهرية", status: "تم الإرسال" },
      ],
    },
    student: {
      title: "تعلّمك ومسارك في مكان واحد.",
      description: "اعرف واجباتك القادمة، سلّم أعمالك بوضوح، واطّلع على نتائجك وملاحظات معلّميك أولاً بأول.",
      features: [
        "تسليم الواجبات بروابط وملاحظات",
        "جدول الحصص والدروس اليومية",
        "سجل العلامات المعتمدة ونتائج التقييم",
      ],
      previewRole: "مساحة الطالب",
      previewGreeting: "أهلاً بك، خطوة جديدة اليوم.",
      previewTitle: "مهامي ومسار تعلّمي",
      previewFootnote: "كل ما يلزمك لتنظيم يومك الدراسي.",
      rows: [
        { icon: "#icon-book", title: "واجب تحليل نص أدبي", sub: "مطلوب التسليم قبل الأحد", status: "قيد الإنجاز" },
        { icon: "#icon-check", title: "اختبار قصير: العلوم الحياتية", sub: "تم التصحيح والتقييم 9/10", status: "مكتمل" },
        { icon: "#icon-star", title: "حصة الرياضيات القادمة", sub: "الحصة الثالثة · القاعة 102", status: "اليوم 10:30" },
      ],
    },
    parent: {
      title: "شراكة حقيقية مع المدرسة.",
      description: "تابع تقدم أبنائك، سجّل حضورهم ونتائجهم، وتواصل مع الإدارة والمعلمين بكل سهولة وموثوقية.",
      features: [
        "تبديل فوري بين الأبناء في العائلة",
        "متابعة الحضور والغياب والإشعارات",
        "اطلاع مباشر على العلامات المنشورة",
      ],
      previewRole: "بوابة ولي الأمر",
      previewGreeting: "متابعة مستمرة لرحلة أبنائك.",
      previewTitle: "ملخص مسار الطالب",
      previewFootnote: "تواصل راقٍ يضع الأسرة في قلب التجربة.",
      rows: [
        { icon: "#icon-check", title: "نتيجة تقييم الشهر الأول", sub: "أحمد · الصف الثامن ب", status: "معتمد" },
        { icon: "#icon-book", title: "سجل الحضور الشهري", sub: "نسبة التزام 98% هذا الفصل", status: "منتظم" },
        { icon: "#icon-star", title: "رسالة من معلم اللغة العربية", sub: "تطور ملحوظ في القراءة التحليلية", status: "جديد" },
      ],
    },
    supervisor: {
      title: "تطوير نوعي للعملية التعليمية.",
      description: "راجع الخطط الدراسية وتاريخ إصداراتها، دوّن ملاحظات الزيارات الصفية، وادعم المعلمين نحو الأفضل.",
      features: [
        "مراجعة إصدارات الخطط الدراسية وقفلها",
        "توثيق الزيارات الميدانية الصفية",
        "تقييم داخلي مبني على معايير دقيقة",
      ],
      previewRole: "لوحة المشرف",
      previewGreeting: "متابعة جودة التعليم.",
      previewTitle: "الزيارات ومراجعة الخطط",
      previewFootnote: "أدوات إشرافية تدعم نمو الكادر التدريسي.",
      rows: [
        { icon: "#icon-book", title: "خطة الرياضيات التراكمية", sub: "مراجعة أهداف نواتج التعلم", status: "تتطلب تعديل" },
        { icon: "#icon-star", title: "زيارة صفية للصف التاسع", sub: "المعلم: أحمد خالد · تقييم أداء", status: "مجدولة" },
        { icon: "#icon-check", title: "اعتماد خطة مبحث الكيمياء", sub: "الفصل الدراسي الأول", status: "معتمد" },
      ],
    },
    admin: {
      title: "إدارة متقنة لكل مفاصل النظام.",
      description: "هيئ هوية مدرستك، تحكم بالشعب والمباحث، استورد بيانات الطلبة بنقرة واحدة، وأدر الترحيل السنوي بسلاسة.",
      features: [
        "استيراد فوري للطلبة والبيانات (CSV)",
        "ترحيل سنوي مستقل للشعب والصفوف",
        "تخصيص الهوية البصرية وإعدادات السنة",
      ],
      previewRole: "لوحة المسؤول",
      previewGreeting: "بنية النظام وجاهزية المدرسة.",
      previewTitle: "العمليات والإعدادات",
      previewFootnote: "تحكم شامل وآمن في بيانات المدرسة.",
      rows: [
        { icon: "#icon-check", title: "استيراد قائمة الطلبة الجدد", sub: "تم التحقق واستيراد 120 سجل", status: "مكتمل" },
        { icon: "#icon-book", title: "توزيع أنصبة المباحث والشعب", sub: "العام الدراسي 2026/2027", status: "مستقر" },
        { icon: "#icon-star", title: "إعدادات هوية المدرسة", sub: "الشعار والألوان والتقويم الأكاديمي", status: "محدث" },
      ],
    },
  };

  const roleTabs = Array.from(document.querySelectorAll(".role-tabs button[role='tab']"));
  const rolePanel = document.getElementById("role-panel");
  const roleTitle = document.getElementById("role-title");
  const roleDesc = document.getElementById("role-description");
  const roleFeatures = document.getElementById("role-features");
  const previewRole = document.getElementById("preview-role");
  const previewGreeting = document.getElementById("preview-greeting");
  const previewTitle = document.getElementById("preview-title");
  const previewRows = document.getElementById("preview-rows");
  const previewFootnote = document.getElementById("preview-footnote");

  function switchRole(roleKey, triggerBtn) {
    const data = ROLES_DATA[roleKey];
    if (!data) return;

    // Update Tab state
    roleTabs.forEach((tab) => {
      const isSelected = tab === triggerBtn;
      tab.setAttribute("aria-selected", String(isSelected));
      tab.setAttribute("tabindex", isSelected ? "0" : "-1");
    });

    if (triggerBtn && rolePanel) {
      rolePanel.setAttribute("aria-labelledby", triggerBtn.id);
    }

    // Smooth subtle fade update
    if (rolePanel) {
      rolePanel.style.opacity = "0.75";
      rolePanel.style.transition = "opacity 0.2s ease";
    }

    setTimeout(() => {
      if (roleTitle) roleTitle.textContent = data.title;
      if (roleDesc) roleDesc.textContent = data.description;

      if (roleFeatures) {
        roleFeatures.innerHTML = data.features
          .map((feat) => `<li>${feat}</li>`)
          .join("");
      }

      if (previewRole) previewRole.textContent = data.previewRole;
      if (previewGreeting) previewGreeting.textContent = data.previewGreeting;
      if (previewTitle) previewTitle.textContent = data.previewTitle;
      if (previewFootnote) previewFootnote.textContent = data.previewFootnote;

      if (previewRows) {
        previewRows.innerHTML = data.rows
          .map(
            (row) => `
          <div class="preview-row">
            <svg class="icon" aria-hidden="true"><use href="${row.icon}"/></svg>
            <div><strong>${row.title}</strong><small>${row.sub}</small></div>
            <span class="preview-status">${row.status}</span>
          </div>`
          )
          .join("");
      }

      if (rolePanel) {
        rolePanel.style.opacity = "1";
      }
    }, 100);
  }

  if (roleTabs.length > 0) {
    roleTabs.forEach((btn, index) => {
      const roleKey = btn.dataset.role;

      btn.addEventListener("click", () => {
        switchRole(roleKey, btn);
      });

      // Keyboard arrow navigation
      btn.addEventListener("keydown", (e) => {
        let nextIndex = null;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          nextIndex = (index + 1) % roleTabs.length;
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          nextIndex = (index - 1 + roleTabs.length) % roleTabs.length;
        }

        if (nextIndex !== null) {
          e.preventDefault();
          const targetTab = roleTabs[nextIndex];
          targetTab.focus();
          switchRole(targetTab.dataset.role, targetTab);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // D. School Identity Brand Theme Preview
  // --------------------------------------------------------------------------
  const themeButtons = Array.from(document.querySelectorAll(".theme-option"));
  const stationery = document.querySelector(".school-stationery");
  const themeLabel = document.getElementById("theme-label");

  const THEME_LABELS = {
    burgundy: "عنّابي عون",
    forest: "أخضر زمردي",
    blue: "أزرق ملكي",
  };

  if (themeButtons.length > 0 && stationery) {
    themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.theme;
        stationery.setAttribute("data-theme", theme);

        themeButtons.forEach((b) => {
          const isPressed = b === btn;
          b.setAttribute("aria-pressed", String(isPressed));
        });

        if (themeLabel && THEME_LABELS[theme]) {
          themeLabel.textContent = THEME_LABELS[theme];
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // E. 3D Tilt Effect on Product Preview Card
  // --------------------------------------------------------------------------
  const productPreview = document.querySelector(".product-preview");
  if (productPreview && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let tiltAnim = null;

    productPreview.addEventListener("mousemove", (e) => {
      const rect = productPreview.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((centerY - y) / centerY) * 6;
      const rotateY = ((x - centerX) / centerX) * 8;

      cancelAnimationFrame(tiltAnim);
      tiltAnim = requestAnimationFrame(() => {
        productPreview.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });
    });

    productPreview.addEventListener("mouseleave", () => {
      cancelAnimationFrame(tiltAnim);
      productPreview.style.transform = "";
    });
  }

  // --------------------------------------------------------------------------
  // F. Demo Request Form Handler
  // --------------------------------------------------------------------------
  const demoForm = document.getElementById("demo-form");
  const formStatus = document.getElementById("form-status");

  if (demoForm) {
    demoForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitBtn = demoForm.querySelector("button[type='submit']");
      const originalText = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "جارٍ حفظ الطلب التجريبي...";
      }

      const formData = new FormData(demoForm);
      const lead = {
        schoolName: String(formData.get("schoolName") || "").trim(),
        contactName: String(formData.get("contactName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        studentCount: String(formData.get("studentCount") || "").trim(),
        priority: String(formData.get("priority") || "").trim(),
        timestamp: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem("awn_school_leads") || "[]");
        existing.push(lead);
        localStorage.setItem("awn_school_leads", JSON.stringify(existing));

        // Sync with Awn runtime if active
        if (typeof Awn !== "undefined" && typeof Awn.write === "function") {
          try { Awn.write("school-leads", existing); } catch { /* ignore in demo */ }
        }

        setTimeout(() => {
          if (formStatus) {
            formStatus.removeAttribute("data-error");
            formStatus.textContent = `تم تسجيل طلب العرض لمدرسة «${lead.schoolName}» بنجاح في متصفحك.`;
          }
          demoForm.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }, 500);
      } catch (err) {
        if (formStatus) {
          formStatus.setAttribute("data-error", "true");
          formStatus.textContent = "تعذر حفظ الطلب في المتصفح. أعد المحاولة.";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // G. Dynamic Copyright Year
  // --------------------------------------------------------------------------
  const yearElem = document.getElementById("copyright-year");
  if (yearElem) {
    yearElem.textContent = String(new Date().getFullYear());
  }
});
