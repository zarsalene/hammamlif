// Hammam-Lif Volleyball Academy: interactive features.
// Progress is stored only on this device (localStorage). No accounts, no child profiles.
(function () {
  var STORE = "cshl-progress";
  var state = load();

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      if (s && typeof s === "object") return Object.assign({ badges: {}, lessons: {}, challenge: false, best: 0 }, s);
    } catch (e) {}
    return { badges: {}, lessons: {}, challenge: false, best: 0 };
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
  function L() { return window.I18N[window.__lang || "en"]; }
  function T(k) { return window.I18N_T(k); }
  function fill(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; });
  }

  // ---------- Mobile nav ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
  });

  // ---------- Badges ----------
  function earn(id) {
    if (state.badges[id]) return;
    state.badges[id] = true;
    save();
    renderBadges();
    document.dispatchEvent(new CustomEvent("cshl:badge", { detail: id })); // games.js shows the celebration
  }
  function renderBadges() {
    var list = document.getElementById("badgeList");
    list.innerHTML = "";
    L().badges.forEach(function (b) {
      var li = document.createElement("li");
      var got = !!state.badges[b.id];
      li.className = got ? "earned" : "";
      li.textContent = (got ? b.icon + " " : "🔒 ") + b.name + (got ? "" : " · " + b.need);
      list.appendChild(li);
    });
  }

  // ---------- Quiz ----------
  var qIndex = 0, qRight = 0, answered = false, qButtons = [];
  var qEls = {
    num: document.getElementById("qNum"), total: document.getElementById("qTotal"),
    text: document.getElementById("qText"), opts: document.getElementById("qOptions"),
    fb: document.getElementById("qFeedback"), next: document.getElementById("qNext"),
    result: document.getElementById("qResult")
  };

  function showQuestion() {
    var quiz = L().quiz;
    answered = false;
    qEls.fb.textContent = "";
    qEls.next.hidden = true;
    qEls.result.hidden = true;
    qEls.opts.hidden = false;
    qEls.num.textContent = qIndex + 1;
    qEls.total.textContent = quiz.length;
    var item = quiz[qIndex];
    qEls.text.textContent = item.q;
    qEls.opts.innerHTML = "";
    qButtons = [];
    // Show answers in a new random order each time; i stays the index in the data.
    window.GameLogic.shuffle(item.a.map(function (_, i) { return i; })).forEach(function (i) {
      var b = document.createElement("button");
      b.className = "option";
      b.textContent = item.a[i];
      b.addEventListener("click", function () { pick(i); });
      qButtons[i] = b;
      qEls.opts.appendChild(b);
    });
  }

  function pick(i) {
    if (answered) return;
    answered = true;
    var item = L().quiz[qIndex];
    qButtons.forEach(function (b) { b.disabled = true; });
    if (i === item.c) {
      qRight++;
      qButtons[i].classList.add("correct");
      qEls.fb.textContent = T("quizRight");
    } else {
      qButtons[i].classList.add("wrong");
      qButtons[item.c].classList.add("correct");
      qEls.fb.textContent = T("quizWrong");
    }
    qEls.next.hidden = false;
    qEls.next.textContent = T("quizNext");
  }

  qEls.next.addEventListener("click", function () {
    if (qIndex + 1 < L().quiz.length) {
      qIndex++;
      showQuestion();
    } else {
      finishQuiz();
    }
  });

  var lastScore = null;
  function finishQuiz() {
    var total = L().quiz.length;
    if (lastScore === null) { lastScore = qRight; earn("first"); }
    qIndex = 0; qRight = 0;
    qEls.opts.hidden = true;
    qEls.text.textContent = T("quizEnd");
    qEls.fb.textContent = "";
    qEls.next.hidden = true;
    qEls.result.hidden = false;
    qEls.result.innerHTML = "";
    var line = document.createElement("p");
    line.textContent = fill(T("quizScore"), { s: lastScore, t: total });
    var again = document.createElement("button");
    again.className = "btn btn-ghost";
    again.textContent = T("quizAgain");
    again.addEventListener("click", function () { lastScore = null; showQuestion(); });
    qEls.result.appendChild(line);
    qEls.result.appendChild(again);
  }

  // Mini-games live in js/games.js.

  // ---------- Weekly challenge ----------
  var chk = document.getElementById("challengeDone");
  chk.checked = !!state.challenge;
  chk.addEventListener("change", function () {
    state.challenge = chk.checked;
    if (chk.checked) earn("team");
    save();
  });

  // ---------- Lessons ----------
  var currentAge = "u7";
  var tabs = document.querySelectorAll(".tabs [data-age]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      currentAge = tab.getAttribute("data-age");
      tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t === tab)); });
      renderLessons();
    });
  });

  function renderLessons() {
    var ol = document.getElementById("lessons");
    ol.innerHTML = "";
    L().lessons[currentAge].forEach(function (lesson, i) {
      var key = currentAge + "-" + i;
      var done = !!state.lessons[key];
      var li = document.createElement("li");
      var h = document.createElement("h3");
      h.textContent = lesson.t;
      var p = document.createElement("p");
      p.textContent = lesson.d;
      var btn = document.createElement("button");
      btn.className = "done-btn";
      btn.setAttribute("aria-pressed", String(done));
      btn.textContent = done ? T("undo") : T("done");
      btn.addEventListener("click", function () {
        state.lessons[key] = !state.lessons[key];
        if (Object.keys(state.lessons).filter(function (k) { return state.lessons[k]; }).length >= 3) earn("learner");
        save();
        renderLessons();
      });
      li.appendChild(h); li.appendChild(p); li.appendChild(btn);
      ol.appendChild(li);
    });
  }

  // ---------- Hero video ----------
  // Visitors who ask for less motion see the still poster frame instead.
  var heroVideo = document.querySelector(".hero-media video");
  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  // ---------- WhatsApp links ----------
  // The number lives in each link's href; this adds the ready message in the current language.
  function setWhatsApp() {
    document.querySelectorAll("a[data-wa]").forEach(function (a) {
      a.href = a.getAttribute("href").split("?")[0] + "?text=" + encodeURIComponent(T("waText"));
    });
  }

  // ---------- Refresh on language change ----------
  function refresh() {
    // Re-render translated parts. A finished quiz is redrawn in the new language.
    if (!qEls.result.hidden) { finishQuiz(); } else { showQuestion(); }
    renderBadges();
    renderLessons();
    setWhatsApp();
  }

  // games.js uses these to save progress and give badges.
  window.App = { refresh: refresh, earn: earn, state: state, save: save };

  document.getElementById("year").textContent = new Date().getFullYear();
  renderLessons();
  renderBadges();
  showQuestion();
  setWhatsApp();
})();
