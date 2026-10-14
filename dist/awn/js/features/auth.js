import { authenticate } from "../services/auth-service.js";

const messages = {
  ar: {
    pageTitle: "بوابة عون التعليمية",
    portalLabel: "وزارة التربية والتعليم",
    heading: "المنظومة الوطنية لإدارة التعليم",
    description: "سجّل الدخول للمتابعة إلى بوابة عون التعليمية.",
    usernameLabel: "الرقم الوطني / اسم المستخدم",
    usernameHint: "أدخل بيانات الدخول المعتمدة لك.",
    passwordLabel: "كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    submit: "تسجيل الدخول",
    loading: "جارٍ التحقق…",
    support: "تحتاج مساعدة؟ تواصل مع مسؤول النظام في مدرستك.",
    copyright: "© وزارة التربية والتعليم — المملكة الأردنية الهاشمية",
    invalidCredentials: "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
    serviceUnavailable: "تعذر الاتصال بخدمة الدخول. تحقق من الاتصال أو تواصل مع مسؤول النظام.",
  },
  en: {
    pageTitle: "Awn Education Portal",
    portalLabel: "Ministry of Education",
    heading: "National Education Management System",
    description: "Sign in to continue to the Awn education portal.",
    usernameLabel: "National ID / Username",
    usernameHint: "Enter the credentials assigned to you.",
    passwordLabel: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Sign in",
    loading: "Checking…",
    support: "Need help? Contact your school system administrator.",
    copyright: "© Ministry of Education — Hashemite Kingdom of Jordan",
    invalidCredentials: "Sign-in failed. Check your details and try again.",
    serviceUnavailable: "The sign-in service is unavailable. Check your connection or contact the system administrator.",
  },
};

const form = document.querySelector("[data-auth-form]");
const errorAlert = document.querySelector("[data-error]");
const statusMessage = document.querySelector("[data-status]");
const submitButton = document.querySelector("[data-submit]");
const submitLabel = document.querySelector("[data-submit-label]");
const spinner = document.querySelector("[data-spinner]");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("[data-password-toggle]");
let language = document.documentElement.lang === "en" ? "en" : "ar";

function translate(key) {
  return messages[language][key] ?? messages.ar[key] ?? key;
}

function renderLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAria));
  });
  document.querySelector("[data-language-toggle]").textContent = language === "ar" ? "English" : "العربية";
  document.querySelector("[data-language-toggle]").setAttribute("aria-label", language === "ar" ? "Switch language" : "تغيير اللغة");
  document.title = translate("pageTitle");
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.setAttribute("aria-busy", String(isLoading));
  spinner.hidden = !isLoading;
  submitLabel.textContent = translate(isLoading ? "loading" : "submit");
}

function showError(key) {
  errorAlert.textContent = translate(key);
  errorAlert.hidden = false;
  statusMessage.textContent = "";
}

function isLocalDashboardPath(path) {
  return typeof path === "string" && /^[a-z0-9-]+-dashboard\.html$/.test(path);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorAlert.hidden = true;
  statusMessage.textContent = "";

  if (!form.reportValidity()) return;

  const values = new FormData(form);
  setLoading(true);

  try {
    const user = await authenticate(String(values.get("username")).trim(), String(values.get("password")));
    if (!user) {
      showError("invalidCredentials");
      return;
    }
    if (!isLocalDashboardPath(user.redirect)) {
      throw new Error("INVALID_DEMO_REDIRECT");
    }

    // Demo only. A production backend should set an HttpOnly, Secure session cookie.
    window.localStorage.setItem("awn_session", JSON.stringify({
      username: user.username,
      role: user.role,
      name: user.name,
    }));
    window.location.assign(user.redirect);
  } catch (error) {
    console.error("Sign-in failed", error);
    showError("serviceUnavailable");
  } finally {
    setLoading(false);
  }
});

passwordToggle.addEventListener("click", () => {
  const isVisible = passwordInput.type === "password";
  passwordInput.type = isVisible ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(isVisible));
  passwordToggle.dataset.i18nAria = isVisible ? "hidePassword" : "showPassword";
  passwordToggle.setAttribute("aria-label", translate(passwordToggle.dataset.i18nAria));
});

document.querySelector("[data-language-toggle]").addEventListener("click", () => {
  language = language === "ar" ? "en" : "ar";
  renderLanguage();
});

renderLanguage();

if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.gsap.from(".login-card", { opacity: 0, y: 14, duration: 0.55, ease: "power2.out" });
}