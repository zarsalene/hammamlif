// Language switching: EN / FR / AR. Applies text to every [data-i18n] element.
(function () {
  var LANGS = { en: "ltr", fr: "ltr", ar: "rtl" };
  var KEY = "cshl-lang";

  function t(key) {
    var dict = window.I18N[current()].ui;
    return dict[key] !== undefined ? dict[key] : (window.I18N.en.ui[key] || key);
  }

  function current() {
    return window.__lang || "en";
  }

  function apply(lang) {
    if (!window.I18N[lang]) lang = "en";
    window.__lang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGS[lang];

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    try { localStorage.setItem(KEY, lang); } catch (e) {}

    if (window.App && window.App.refresh) window.App.refresh();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang]");
    if (btn) apply(btn.getAttribute("data-lang"));
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  window.I18N_T = t;
  window.I18N_apply = apply;
  apply(saved || "en");
})();
