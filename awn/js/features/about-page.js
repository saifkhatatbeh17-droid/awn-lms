/**
 * Awn Educational Ecosystem - Clean, Modern About Page Controller
 * Zero visual clutter - pure performance & smooth UX
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. Mobile Menu Controller
  const mobileToggle = document.getElementById("mobileToggle");
  const mobileMenu = document.getElementById("mobileMenu");

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
    // Ensure initial closed state
    closeMobileMenu();

    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.contains("is-open");
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        closeMobileMenu();
      });
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (mobileMenu.classList.contains("is-open")) {
        if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
          closeMobileMenu();
        }
      }
    });

    // Close on ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        closeMobileMenu();
      }
    });
  }

  // 2. Slim Smart Navbar & Reading Progress
  const navbar = document.getElementById("main-nav");
  const scrollProgressBar = document.getElementById("scrollProgressBar");
  const backToTopBtn = document.getElementById("backToTop");

  let lastScrollY = window.scrollY || document.documentElement.scrollTop;
  const hideDelta = 8;

  const handleScroll = () => {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (currentScrollY / docHeight) : 0;

    // Top Progress Line
    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${scrollPercent * 100}%`;
    }

    // Back to top button
    if (backToTopBtn) {
      if (currentScrollY > 300) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    }

    // Smart Navbar State
    if (navbar) {
      if (currentScrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
        navbar.classList.remove("nav-hidden");
      }

      // Auto-hide when scrolling down, reveal when scrolling up
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY && (currentScrollY - lastScrollY > hideDelta)) {
          navbar.classList.add("nav-hidden");
          closeMobileMenu();
        } else if (lastScrollY > currentScrollY && (lastScrollY - currentScrollY > hideDelta)) {
          navbar.classList.remove("nav-hidden");
        }
      } else {
        navbar.classList.remove("nav-hidden");
      }
    }

    lastScrollY = Math.max(0, currentScrollY);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 3. Hero Video Autoplay Assurance
  const heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    const playVideo = () => {
      const promise = heroVideo.play();
      if (promise !== undefined) {
        promise.catch(() => {
          const onInteraction = () => {
            heroVideo.play().catch(() => {});
            ["click", "touchstart", "scroll"].forEach(evt => window.removeEventListener(evt, onInteraction));
          };
          ["click", "touchstart", "scroll"].forEach(evt => window.addEventListener(evt, onInteraction, { once: true }));
        });
      }
    };
    playVideo();
  }

  // 4. Clean Role Switcher (4 Focused Ecosystem Pillars)
  const roleData = {
    teacher: {
      badge: "بوابة المعلم الأردني",
      title: "تمكين المعلم بأحدث الأدوات البيداغوجية",
      desc: "توفر المنظومة للمعلم بيئة متكاملة لإعداد الخطط الدراسية، رصد الحضور بنقرة واحدة، وتطبيق استراتيجيات التعليم المتمايز لمراعاة الفروق الفردية بين الطلبة، مع تقديم تغذية راجعة فورية.",
      btnText: "تسجيل الدخول بدور المعلم",
      userName: "الأستاذ أحمد الحنيطي",
      userRole: "معلم الرياضيات • مدرسة الملك عبدالله الثاني للتميز",
      icon: "person",
      chips: [
        { val: "98%", lbl: "نسبة الالتزام", highlight: false },
        { val: "4", lbl: "واجبات نشطة", highlight: true },
        { val: "32", lbl: "طالباً متفوقاً", highlight: false }
      ],
      features: [
        {
          title: "تخطيط دراسي متقدم:",
          desc: "نماذج خطط يومية وفصلية متوافقة مع معايير وزارة التربية والتعليم."
        },
        {
          title: "رصد سريع ومباشر:",
          desc: "تسجيل الحضور والدرجات والسلوك عبر الهاتف أو الحاسوب دون تعقيد."
        },
        {
          title: "تقييم متمايز وتغذية راجعة:",
          desc: "متابعة تفاعلية للواجبات تسهم في معالجة الفجوات التعليمية مبكراً."
        }
      ],
      list: [
        {
          icon: "task_alt",
          title: "ورقة عمل: التفاضل والتكامل",
          sub: "تم تسليم الحلول من 32 طالباً",
          status: "نشط",
          statusClass: "active"
        },
        {
          icon: "verified",
          title: "الخطة الفصلية المعتمدة",
          sub: "تم تدقيقها من المشرف التربوي",
          status: "معتمد",
          statusClass: "verified"
        }
      ]
    },
    student: {
      badge: "بوابة الطالب المبتكر",
      title: "تجربة تعلّم تفاعلية ترتقي بقدرات كل طالب",
      desc: "واجهة مرنة تمكن الطالب من متابعة واجباته المدرسية، حل التمارين التفاعلية، الاطلاع الفوري على تقييمات المعلمين، وبناء مسار تفوقه الأكاديمي بثقة.",
      btnText: "تسجيل الدخول بدور الطالب",
      userName: "عمر خالد الزعبي",
      userRole: "الصف العاشر الأساسي • مدرسة وصفي التل الثانوية",
      icon: "school",
      chips: [
        { val: "94.5%", lbl: "المعدل التراكمي", highlight: true },
        { val: "2", lbl: "واجبات للتسليم", highlight: false },
        { val: "100%", lbl: "نسبة الحضور", highlight: false }
      ],
      features: [
        {
          title: "لوحة إنجاز تفاعلية:",
          desc: "متابعة حية للعلامات الشهرية، التقارير التقويمية، والملاحظات الإثرائية."
        },
        {
          title: "تسليم رقمي منظم:",
          desc: "رفع الإجابات ومتابعة التغذية الراجعة من المعلمين أولاً بأول."
        },
        {
          title: "بنك مصادر وطني:",
          desc: "إمكانية الوصول للمواد الإثرائية وأوراق العمل الداعمة للمنهاج."
        }
      ],
      list: [
        {
          icon: "assignment",
          title: "واجب الفيزياء: قوانين الحركة",
          sub: "الموعد النهائي: غداً الساعة 6 مساءً",
          status: "قيد الحل",
          statusClass: "active"
        },
        {
          icon: "star",
          title: "شارة التميز في اللغة العربية",
          sub: "تقييم ممتاز في القراءة والتحليل",
          status: "مكتمل",
          statusClass: "verified"
        }
      ]
    },
    parent: {
      badge: "بوابة ولي الأمر الشريك",
      title: "شراكة أسرية لحظية لدعم مسيرة أبنائك",
      desc: "قناة تواصل موثوقة تضع ولي الأمر في قلب الرحلة التعليمية، مع إشعارات مباشرة لدوام الطالب، تقارير دورية للتحصيل الأكاديمي، وقناة اتصال هادفة مع المدرسة.",
      btnText: "تسجيل الدخول كولي أمر",
      userName: "محمد عبد الكريم المجالي",
      userRole: "ولي أمر: سارة (الصف الثامن) ويزن (الصف الخامس)",
      icon: "family_restroom",
      chips: [
        { val: "0", lbl: "غيابات غير مبررة", highlight: false },
        { val: "3", lbl: "تقارير أسبوعية", highlight: true },
        { val: "100%", lbl: "التواصل الأكاديمي", highlight: false }
      ],
      features: [
        {
          title: "تنبيهات فورية ومباشرة:",
          desc: "إشعار فوري بالحضور والانصراف والملاحظات السلوكية اليومية."
        },
        {
          title: "متابعة شاملة للتحصيل:",
          desc: "الاطلاع الدوري على نتائج الاختبارات ومستويات التقدم الدراسي."
        },
        {
          title: "تواصل منظم وشفاف:",
          desc: "توجيه الرسائل للإدارة والمرشد التربوي ضمن بيئة خصوصية محكمة."
        }
      ],
      list: [
        {
          icon: "notifications",
          title: "إشعار حضور: تم تسجيل الحضور بانتظام",
          sub: "مدرسة إناث عمان الأساسية • 7:45 صباحاً",
          status: "إشعار رسمي",
          statusClass: "verified"
        },
        {
          icon: "grade",
          title: "نتيجة اختبار الرياضيات (يزن)",
          sub: "العلامة: 19/20 • أداء متميز",
          status: "ممتاز",
          statusClass: "active"
        }
      ]
    },
    leadership: {
      badge: "لوحة قيادة الإدارة والإشراف",
      title: "حوكمة تربوية متكاملة وقرارات مستندة للبيانات",
      desc: "لوحات مؤشرات أداء متقدمة (BI) تدعم مدراء المدارس والمشرفين التربويين في رصد الانضباط، اعتماد الخطط الدراسية، وتقييم الكفايات التدريسية بدقة وموضوعية.",
      btnText: "تسجيل الدخول كإدارة أو مشرف",
      userName: "د. رائد العبادي وميساء الرواشدة",
      userRole: "إدارة مدرسية وإشراف تربوي • وزارة التربية والتعليم",
      icon: "analytics",
      chips: [
        { val: "97.5%", lbl: "انضباط الكوادر", highlight: true },
        { val: "100%", lbl: "اعتماد الخطط", highlight: false },
        { val: "46", lbl: "زيارة إشرافية", highlight: false }
      ],
      features: [
        {
          title: "رصد مدرسي مباشر:",
          desc: "متابعة لحظية لنسب حضور الكوادر والطلبة ومؤشرات الانضباط المدرسي."
        },
        {
          title: "اعتماد الخطط والتقارير:",
          desc: "تدقيق واعتماد المعاملات والخطط الدراسية إلكترونياً دون أوراق."
        },
        {
          title: "تحليلات الأداء والتوجيه:",
          desc: "قراءة مؤشرات الكفايات لتطوير برامج التدريب والتوجيه المهني للمعلمين."
        }
      ],
      list: [
        {
          icon: "fact_check",
          title: "اعتماد خطط العلوم لشهر أكتوبر",
          sub: "تم التدقيق والموافقة المباشرة",
          status: "مكتمل",
          statusClass: "verified"
        },
        {
          icon: "insights",
          title: "تقرير الزيارة التخصصية",
          sub: "مؤشرات تطبيق استراتيجيات التعلّم النشط",
          status: "معتمد",
          statusClass: "active"
        }
      ]
    }
  };

  const roleTabBtns = document.querySelectorAll(".role-tab-btn");
  const spotBadge = document.getElementById("spotBadge");
  const spotTitle = document.getElementById("spotTitle");
  const spotDesc = document.getElementById("spotDesc");
  const spotFeatures = document.getElementById("spotFeatures");
  const spotBtn = document.getElementById("spotBtn");
  const spotUserName = document.getElementById("spotUserName");
  const spotUserRole = document.getElementById("spotUserRole");
  const spotIcon = document.getElementById("spotIcon");
  const spotChips = document.getElementById("spotChips");
  const spotList = document.getElementById("spotList");
  const roleSpotlight = document.getElementById("roleSpotlight");

  function renderRole(key) {
    const data = roleData[key];
    if (!data) return;

    if (typeof gsap !== "undefined" && roleSpotlight) {
      gsap.to(roleSpotlight, {
        opacity: 0.2,
        y: 6,
        duration: 0.15,
        onComplete: () => {
          applyData();
          gsap.to(roleSpotlight, {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "power2.out"
          });
        }
      });
    } else {
      applyData();
    }

    function applyData() {
      if (spotBadge) spotBadge.textContent = data.badge;
      if (spotTitle) spotTitle.textContent = data.title;
      if (spotDesc) spotDesc.textContent = data.desc;
      if (spotBtn) {
        spotBtn.innerHTML = `<span>${data.btnText}</span><span class="material-symbols-outlined">arrow_back</span>`;
      }
      if (spotUserName) spotUserName.textContent = data.userName;
      if (spotUserRole) spotUserRole.textContent = data.userRole;
      if (spotIcon) spotIcon.textContent = data.icon;

      if (spotFeatures) {
        spotFeatures.innerHTML = data.features.map(f => `
          <div class="feat-item">
            <span class="material-symbols-outlined feat-icon">check_circle</span>
            <div>
              <strong>${f.title}</strong>
              <span>${f.desc}</span>
            </div>
          </div>
        `).join("");
      }

      if (spotChips) {
        spotChips.innerHTML = data.chips.map(c => `
          <div class="chip-item ${c.highlight ? 'highlight' : ''}">
            <span class="chip-val">${c.val}</span>
            <span class="chip-lbl">${c.lbl}</span>
          </div>
        `).join("");
      }

      if (spotList) {
        spotList.innerHTML = data.list.map(item => `
          <div class="preview-row">
            <span class="material-symbols-outlined row-ico">${item.icon}</span>
            <div class="row-txt">
              <span class="row-title">${item.title}</span>
              <span class="row-sub">${item.sub}</span>
            </div>
            <span class="badge-status ${item.statusClass}">${item.status}</span>
          </div>
        `).join("");
      }
    }
  }

  roleTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      roleTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderRole(btn.dataset.role);
    });
  });

  // 5. Smooth GSAP Entrance Animations
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      // Hero Entrance
      gsap.fromTo(".fade-hero", 
        { y: 25, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: "power2.out", delay: 0.1 }
      );

      // Section Fade-Up
      const fadeUps = document.querySelectorAll(".fade-up");
      fadeUps.forEach((elem) => {
        gsap.fromTo(elem,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: {
              trigger: elem,
              start: "top 88%",
              once: true
            }
          }
        );
      });

      // Animated Number Counters
      const counters = document.querySelectorAll(".stat-counter");
      counters.forEach((counter) => {
        const target = parseFloat(counter.getAttribute("data-target")) || 0;
        const isPercentage = target <= 100;

        ScrollTrigger.create({
          trigger: counter,
          start: "top 90%",
          once: true,
          onEnter: () => {
            gsap.fromTo(counter, 
              { innerText: 0 }, 
              {
                innerText: target,
                duration: 1.8,
                ease: "power2.out",
                snap: { innerText: 1 },
                onUpdate: function() {
                  const val = Math.ceil(this.targets()[0].innerText);
                  if (isPercentage) {
                    counter.innerText = val;
                  } else {
                    counter.innerText = val.toLocaleString("en-US");
                  }
                }
              }
            );
          }
        });
      });

      window.addEventListener("load", () => {
        ScrollTrigger.refresh();
      });
    }
  }
});
