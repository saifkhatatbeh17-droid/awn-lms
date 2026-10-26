import { authenticate, DASHBOARDS_BY_ROLE } from "../services/auth-service.js";

// Login and dashboards use the same validated session.
const existingSession = await AwnSession.ready;
if (existingSession) window.location.replace(DASHBOARDS_BY_ROLE[existingSession.role]);

const messages = {
  ar: {
    pageTitle: "تسجيل الدخول | عون",
    skipToLogin: "انتقل إلى تسجيل الدخول",
    heading: "أهلًا بعودتك.",
    description: "سجّل الدخول لمتابعة يومك المدرسي.",
    usernameLabel: "اسم المستخدم",
    usernameHint: "استخدم الحساب الذي زوّدتك به مدرستك.",
    passwordLabel: "كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    submit: "تسجيل الدخول",
    loading: "جارٍ التحقق…",
    support: "تحتاج مساعدة في الدخول؟ تواصل مع مسؤول مدرستك.",
    passLabel: "بطاقة دخولك إلى عون",
    entryKicker: "كلّ الأدوار. بداية واحدة.",
    entryLineOne: "هنا،",
    entryLineTwo: "يبدأ يومك.",
    entryLineThree: "ويكبر أثرك.",
    entryNote: "مساحة تجمع مدرستك، وتترك لك مساحة لتصنع الفرق.",
    entrySignature: "معك. في كلّ خطوة.",
    artCaption: "كلّ فكرة، تفتح أفقًا.",
    artIndex: "مساحة للتعلّم. ومساحة لك.",
    footerNote: "التعلّم يبدأ بالإنسان.",
    aboutUs: "من نحن",
    copyright: "© عون — مساحة تجمع مدرستك",
    invalidCredentials: "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
    serviceUnavailable: "تعذر الاتصال بخدمة الدخول. تحقق من الاتصال أو تواصل مع مسؤول النظام.",
  },
  en: {
    pageTitle: "Sign in | Awn",
    skipToLogin: "Skip to sign in",
    heading: "Welcome back.",
    description: "Sign in to continue your school day.",
    usernameLabel: "Username",
    usernameHint: "Use the account provided by your school.",
    passwordLabel: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Sign in",
    loading: "Checking…",
    support: "Need help signing in? Contact your school administrator.",
    passLabel: "Your entry pass to Awn",
    entryKicker: "Every role. One beginning.",
    entryLineOne: "Your day.",
    entryLineTwo: "Your space.",
    entryLineThree: "Your impact.",
    entryNote: "A space that brings your school together, and gives you room to make a difference.",
    entrySignature: "With you. Every step.",
    artCaption: "Every idea opens a possibility.",
    artIndex: "Room to learn. Room for you.",
    footerNote: "Learning begins with people.",
    aboutUs: "About Us",
    copyright: "© Awn — Bringing your school together",
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
let currentErrorKey = null;

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
  if (currentErrorKey && !errorAlert.hidden) errorAlert.textContent = translate(currentErrorKey);
  if (submitButton.disabled) submitLabel.textContent = translate("loading");
}

function setLoading(isLoading) {
  AwnUI.setBusy(submitButton, isLoading);
  submitButton.setAttribute("aria-busy", String(isLoading));
  spinner.hidden = !isLoading;
  submitLabel.textContent = translate(isLoading ? "loading" : "submit");
}

function showError(key) {
  currentErrorKey = key;
  errorAlert.textContent = translate(key);
  errorAlert.hidden = false;
  statusMessage.textContent = "";
}

function isLocalDashboardPath(path) {
  return typeof path === "string" && /^[a-z0-9-]+-dashboard\.html$/.test(path);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;
  errorAlert.hidden = true;
  currentErrorKey = null;
  statusMessage.textContent = "";

  if (!form.reportValidity()) return;

  const values = new FormData(form);
  setLoading(true);

  try {
    const authResult = await authenticate(String(values.get("username")).trim(), String(values.get("password")));
    if (!authResult || !authResult.success || !authResult.data) {
      showError("invalidCredentials");
      return;
    }
    const user = authResult.data;
    if (!isLocalDashboardPath(user.redirect)) {
      throw new Error("INVALID_DEMO_REDIRECT");
    }

    // Demo only: Ensure password is never stored
    AwnSession.set(user);
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
