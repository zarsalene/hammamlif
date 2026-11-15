// Volleyball mini-games: game picker, Keep it up, Serve, Block, Rotation, Memory, and the badge celebration.
// Rules live in game-logic.js (tested in tests/games.test.js). Progress is saved in the shared
// "cshl-progress" state through window.App (app.js). No network calls, no child data.
(function () {
  var G = window.GameLogic, App = window.App;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return document.getElementById(id); }
  function T(k) { return window.I18N_T(k); }
  // Fill {name} slots. A value that starts with @ is a text key, translated at render time.
  function fill(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (_, k) {
      var v = vars[k];
      return typeof v === "string" && v.charAt(0) === "@" ? T(v.slice(1)) : v;
    });
  }

  // Status messages remember their key so a language change can redraw them.
  var msgEls = [];
  function say(el, key, vars) {
    el._msg = [key, vars || {}];
    el.textContent = fill(T(key), vars || {});
    if (msgEls.indexOf(el) < 0) msgEls.push(el);
  }
  function clear(el) { el._msg = null; el.textContent = ""; }

  // requestAnimationFrame loop with dt in ms. step() returns false to stop.
  // All loops pause while the browser tab is hidden and resume when it comes back.
  var loops = [];
  function Loop(step) {
    var id = 0, last = 0;
    var self = { running: false, paused: false };
    function frame(t) {
      var dt = last ? Math.min(50, t - last) : 16;
      last = t;
      if (!self.running) return;
      if (step(dt) === false) { self.running = false; return; }
      id = requestAnimationFrame(frame);
    }
    self.start = function () { if (self.running) return; self.running = true; last = 0; id = requestAnimationFrame(frame); };
    self.stop = function () { self.running = false; self.paused = false; cancelAnimationFrame(id); };
    loops.push(self);
    return self;
  }
  document.addEventListener("visibilitychange", function () {
    loops.forEach(function (l) {
      if (document.hidden && l.running) { l.stop(); l.paused = true; }
      else if (!document.hidden && l.paused) { l.paused = false; l.start(); }
    });
  });

  // ---------- Game picker (tabs) ----------
  var games = {}; // panel id -> { stop() }
  var tabs = [].slice.call(document.querySelectorAll("#gameTabs [role=tab]"));
  var current = "miniGame";
  function showGame(tab, focus) {
    var id = tab.getAttribute("aria-controls");
    if (id !== current && games[current]) games[current].stop();
    current = id;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { showGame(tab); });
    tab.addEventListener("keydown", function (e) {
      var step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      if (document.documentElement.dir === "rtl") step = -step;
      showGame(tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length], true);
    });
  });

  // ---------- 1. Keep it up ----------
  (function () {
    var stage = $("stage"), ball = $("gameBall"), scoreEl = $("gameScore"), bestEl = $("gameBest"), msg = $("gameMsg");
    var R = 30, GRAVITY = 1000, ZONE = 0.55; // ball radius px, px/s², keyboard zone starts at 55% height
    var timeScale = reduced ? 0.7 : 1;
    var x = 0, y = 0, vx = 0, vy = 0, spin = 0, hits = 0, lastHit = 0, playing = false;

    function draw() { ball.style.transform = "translate(" + (x - R) + "px," + (y - R) + "px) rotate(" + spin + "deg)"; }

    var loop = Loop(function (dt) {
      var w = stage.clientWidth, h = stage.clientHeight;
      var t = dt / 1000 * G.keepSpeed(hits) * timeScale;
      vy += GRAVITY * t;
      x += vx * t; y += vy * t; spin += vx * t;
      if (x < R) { x = R; vx = Math.abs(vx); } else if (x > w - R) { x = w - R; vx = -Math.abs(vx); }
      if (y < R) { y = R; vy = Math.abs(vy) * 0.3; }
      if (y > h - R) { y = h - R; draw(); end(); return false; }
      draw();
    });

    function hit(fromX) {
      var now = performance.now();
      if (now - lastHit < 120) return; // one tap, one touch
      lastHit = now;
      hits++;
      vy = -Math.sqrt(2 * GRAVITY * stage.clientHeight * 0.62);
      // The ball goes away from where it was hit, plus a little random drift.
      vx = Math.max(-260, Math.min(260, (x - fromX) / R * 140 + (Math.random() - 0.5) * 160));
      scoreEl.textContent = hits;
      if (hits > App.state.best) { App.state.best = hits; bestEl.textContent = hits; App.save(); }
      if (hits >= 10) App.earn("ten");
      if (hits >= 25) App.earn("keep25");
      say(msg, "gameGo");
    }

    function start() {
      hits = 0; spin = 0; vy = 0;
      x = stage.clientWidth / 2; y = R + 10;
      vx = (Math.random() < 0.5 ? -1 : 1) * 90;
      scoreEl.textContent = 0;
      ball.classList.remove("rest");
      draw();
      playing = true;
      say(msg, "gamePlay");
      loop.start();
      stage.focus({ preventScroll: true });
    }
    function end() { playing = false; loop.stop(); say(msg, "gameOver", { s: hits }); }

    stage.addEventListener("pointerdown", function (e) {
      if (!playing) { say(msg, "gamePressStart"); return; }
      var r = stage.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      if (G.hitBall(px, py, x, y, R)) hit(px); else say(msg, "gameMiss");
    });
    stage.addEventListener("keydown", function (e) {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!playing) { start(); return; }
      if (y > stage.clientHeight * ZONE) hit(x + (Math.random() - 0.5) * R); else say(msg, "keepWait");
    });
    $("gameReset").addEventListener("click", start);
    bestEl.textContent = App.state.best;

    games.miniGame = {
      stop: function () {
        if (!playing) return;
        playing = false; loop.stop();
        ball.classList.add("rest"); ball.style.transform = "";
        say(msg, "gamePressStart");
      }
    };
  })();

  // ---------- 2. Serve to the target ----------
  (function () {
    var marker = $("serveMarker"), ballEl = $("serveBall"), msg = $("serveMsg");
    var numEl = $("serveNum"), ptsEl = $("servePts"), goBtn = $("serveBtn");
    var SERVES = 5, period = reduced ? 2800 : 1700;
    var phase = 0, p = 0, n = 0, pts = 0, landed = 0, timer = 0;
    var LAND_Y = { net: 284, short: 240, mid: 160, deep: 80, out: 20 };

    var meter = Loop(function (dt) {
      phase = (phase + dt / period) % 1;
      p = phase < 0.5 ? phase * 2 : 2 - phase * 2; // goes 0 to 1 and back
      marker.style.left = (p * 100) + "%";
    });

    // Ball flight from the server to (tx, ty); the ball grows in the middle to look high.
    var fx = 0, fy = 0, ft = 0, done = null;
    var flight = Loop(function (dt) {
      ft = Math.min(1, ft + dt / 650);
      ballEl.setAttribute("cx", 150 + (fx - 150) * ft);
      ballEl.setAttribute("cy", 340 + (fy - 340) * ft);
      ballEl.setAttribute("r", 9 + 7 * Math.sin(Math.PI * ft));
      if (ft >= 1) { done(); return false; }
    });
    function resetBall() { ballEl.setAttribute("cx", 150); ballEl.setAttribute("cy", 340); ballEl.setAttribute("r", 9); }

    function next() { resetBall(); phase = 0; meter.start(); say(msg, "serveReady"); }
    function start() {
      clearTimeout(timer); flight.stop();
      n = 0; pts = 0; landed = 0;
      numEl.textContent = 0; ptsEl.textContent = 0;
      next();
      goBtn.focus({ preventScroll: true });
    }
    function serve() {
      if (!meter.running) {
        if (!flight.running && !timer && n === 0) start(); // first press of Serve also starts the round
        return;
      }
      meter.stop();
      n++; numEl.textContent = n;
      var r = G.serveZone(p);
      fx = 150 + (Math.random() - 0.5) * 160; fy = LAND_Y[r.zone]; ft = 0;
      done = function () {
        pts += r.pts; ptsEl.textContent = pts;
        if (r.pts) landed++;
        say(msg, r.zone === "net" ? "serveNet" : r.zone === "out" ? "serveOut" : "serveIn", { p: r.pts });
        timer = setTimeout(function () {
          timer = 0;
          if (n < SERVES) { next(); return; }
          say(msg, "serveEnd", { s: pts, n: landed });
          n = 0;
          if (landed === SERVES) App.earn("serve5");
        }, 1200);
      };
      flight.start();
    }
    goBtn.addEventListener("click", serve);
    $("serveStart").addEventListener("click", start);
    games.serveGame = {
      stop: function () { meter.stop(); flight.stop(); clearTimeout(timer); timer = 0; n = 0; resetBall(); clear(msg); }
    };
  })();

  // ---------- 3. Block the spike ----------
  (function () {
    var panel = $("blockGame"), msg = $("blockMsg"), bar = $("blockTimer");
    var hitters = [].slice.call(panel.querySelectorAll(".hitter"));
    var zoneBtns = [].slice.call(panel.querySelectorAll(".zone-btn"));
    var ZONE_KEYS = ["@blockLeft", "@blockMid", "@blockRight"];
    var TOTAL = 15, GAP = 700;
    var zone = -1, n = 0, blocks = 0, phase = "idle", t = 0, win = 0;

    var loop = Loop(function (dt) {
      t += dt;
      if (phase === "spike") {
        bar.style.transform = "scaleX(" + Math.max(0, 1 - t / win) + ")";
        if (t >= win) answer(-1);
      } else if (phase === "gap" && t >= GAP) {
        next();
      }
      return phase !== "idle";
    });

    function mark() {
      hitters.forEach(function (h, i) { h.classList.toggle("on", phase === "spike" && i === zone); });
    }
    function next() {
      zoneBtns.forEach(function (b) { b.classList.remove("good", "bad"); });
      if (n >= TOTAL) { end(); return; }
      n++; $("blockNum").textContent = n;
      zone = Math.floor(Math.random() * 3);
      win = G.blockWindow(blocks); t = 0; phase = "spike";
      mark();
      say(msg, "blockCue", { z: ZONE_KEYS[zone] });
    }
    function answer(z) {
      if (phase !== "spike") return;
      var ok = z === zone;
      if (ok) { blocks++; $("blockPts").textContent = blocks; }
      if (z >= 0) zoneBtns[z].classList.add(ok ? "good" : "bad");
      phase = "gap"; t = 0; mark();
      bar.style.transform = "scaleX(0)";
      say(msg, ok ? "blockGood" : z < 0 ? "blockLate" : "blockWrong");
      if (blocks >= 10) App.earn("block10");
    }
    function end() {
      phase = "idle"; mark();
      say(msg, "blockEnd", { s: blocks, t: TOTAL });
    }
    function start() {
      n = 0; blocks = 0; phase = "gap"; t = 0;
      $("blockNum").textContent = 0; $("blockPts").textContent = 0;
      clear(msg);
      loop.stop(); loop.start();
      zoneBtns[1].focus({ preventScroll: true });
    }
    zoneBtns.forEach(function (b, i) { b.addEventListener("click", function () { answer(i); }); });
    // Arrow keys: the court is drawn left to right in every language, so keys match the picture.
    panel.addEventListener("keydown", function (e) {
      if (!(e.key in G.BLOCK_KEYS) || phase === "idle") return;
      e.preventDefault();
      answer(G.BLOCK_KEYS[e.key]);
    });
    $("blockStart").addEventListener("click", start);
    games.blockGame = {
      stop: function () { if (phase === "idle") return; phase = "idle"; loop.stop(); mark(); clear(msg); }
    };
  })();

  // ---------- 4. Rotation puzzle ----------
  var rotation = (function () {
    var grid = $("rotGrid"), ask = $("rotAsk"), msg = $("rotMsg");
    var LAYOUT = [4, 3, 2, 5, 6, 1]; // front row (net side) then back row, seen from behind your team
    var ROUNDS = 5, START_TEAM = [7, 3, 10, 5, 9, 12]; // shirt numbers on spots 1 to 6
    var team = START_TEAM.slice(), round = 0, firstTry = 0, tries = 0, question = "", who = 0;
    var playing = false, waiting = false, timer = 0, spots = {};

    LAYOUT.forEach(function (spot) {
      var b = document.createElement("button");
      b.className = "spot";
      b.innerHTML = '<span class="spot-no" aria-hidden="true">' + spot + '</span><span class="shirt" aria-hidden="true"></span>';
      b.addEventListener("click", function () { tap(spot); });
      spots[spot] = b;
      grid.appendChild(b);
    });

    function update() {
      LAYOUT.forEach(function (spot) {
        var b = spots[spot], player = team[spot - 1];
        b.querySelector(".shirt").textContent = player;
        b.setAttribute("aria-label", fill(T("rotSpot"), { p: spot, n: player }));
        b.classList.toggle("pick", question === "move" && spot === who);
      });
    }
    function newRound() {
      waiting = false; round++; tries = 0;
      $("rotNum").textContent = round;
      LAYOUT.forEach(function (s) { spots[s].classList.remove("moved", "wrong"); });
      question = round % 2 ? "server" : "move";
      who = 1 + Math.floor(Math.random() * 6);
      say(ask, question === "server" ? "rotAskServer" : "rotAskMove", { n: team[who - 1] });
      clear(msg);
      update();
    }
    function tap(spot) {
      if (!playing || waiting) return;
      var right = question === "server" ? 2 : G.nextSpot(who);
      if (spot !== right) {
        tries++;
        spots[spot].classList.add("wrong");
        say(msg, "rotWrong");
        return;
      }
      if (tries === 0) firstTry++;
      team = G.rotate(team);
      question = "";
      update();
      LAYOUT.forEach(function (s) { spots[s].classList.remove("wrong"); spots[s].classList.add("moved"); });
      say(msg, "rotRight");
      waiting = true;
      timer = setTimeout(function () {
        if (round < ROUNDS) { newRound(); return; }
        playing = false;
        say(ask, "rotEnd", { s: firstTry, t: ROUNDS });
        if (firstTry === ROUNDS) App.earn("rotate");
      }, 1300);
    }
    function start() {
      clearTimeout(timer);
      team = START_TEAM.slice(); round = 0; firstTry = 0; playing = true;
      newRound();
      spots[1].focus({ preventScroll: true });
    }
    $("rotStart").addEventListener("click", start);
    games.rotationGame = {
      stop: function () { clearTimeout(timer); playing = false; question = ""; update(); }
    };
    update();
    return { update: update };
  })();

  // ---------- 5. Skill memory ----------
  var memory = (function () {
    var grid = $("memGrid"), msg = $("memMsg"), movesEl = $("memMoves");
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    // Simple line pictures, 64 x 64. Ball = yellow circle, player = dark lines.
    var ICONS = {
      bump: '<circle class="ball" cx="32" cy="14" r="8"/><circle class="head" cx="32" cy="50" r="6"/><path d="M20 60 L32 30 L44 60"/>',
      set: '<circle class="ball" cx="32" cy="12" r="8"/><circle class="head" cx="32" cy="46" r="6"/><path d="M24 56 L24 30 M40 56 L40 30 M20 28 L28 24 M44 28 L36 24"/>',
      spike: '<circle class="ball" cx="44" cy="14" r="7"/><circle class="head" cx="18" cy="34" r="6"/><path d="M22 42 L36 18 M44 26 L44 40 M38 34 L44 42 L50 34"/>',
      serve: '<circle class="ball" cx="40" cy="12" r="7"/><circle class="head" cx="18" cy="44" r="6"/><path d="M22 52 L34 36" /><path d="M36 32 L39 22" stroke-dasharray="3 4"/><path d="M8 60 L56 60"/>',
      block: '<path d="M6 46 L58 46 M6 52 L58 52"/><path d="M22 40 L22 18 M18 20 L22 12 L26 20 M42 40 L42 18 M38 20 L42 12 L46 20"/><circle class="ball" cx="32" cy="10" r="6"/>',
      dig: '<path d="M4 60 L60 60"/><circle class="head" cx="16" cy="40" r="6"/><path d="M20 48 L46 54"/><circle class="ball" cx="50" cy="46" r="7"/>'
    };
    var deck = [], open = [], moves = 0, found = 0, lock = false, timer = 0;

    function label() {
      deck.forEach(function (c, i) {
        var name = T("sk" + cap(c.skill));
        if (c.kind === "name") c.el.querySelector(".front").textContent = name;
        c.el.setAttribute("aria-label", c.up ? (c.kind === "name" ? name : T("pic" + cap(c.skill))) : fill(T("memHidden"), { n: i + 1 }));
      });
    }
    function deal() {
      clearTimeout(timer);
      deck = G.makeDeck(G.SKILLS); open = []; moves = 0; found = 0; lock = false;
      movesEl.textContent = 0;
      grid.innerHTML = "";
      deck.forEach(function (c) {
        var b = document.createElement("button");
        b.className = "mem-card";
        b.innerHTML = '<span class="face back" aria-hidden="true"></span><span class="face front" aria-hidden="true">' +
          (c.kind === "pic" ? '<svg viewBox="0 0 64 64">' + ICONS[c.skill] + "</svg>" : "") + "</span>";
        b.addEventListener("click", function () { flip(c); });
        c.el = b;
        grid.appendChild(b);
      });
      label();
      clear(msg);
    }
    function flip(c) {
      if (lock || c.up) return;
      c.up = true; c.el.classList.add("up");
      open.push(c);
      label();
      if (open.length < 2) return;
      var a = open[0], b = open[1];
      open = [];
      moves++; movesEl.textContent = moves;
      if (G.isPair(a, b)) {
        a.el.classList.add("done"); b.el.classList.add("done");
        found++;
        say(msg, "memMatch", { s: "@sk" + cap(a.skill) });
        if (found === G.SKILLS.length) {
          say(msg, "memEnd", { m: moves });
          if (moves <= 12) App.earn("memory");
        }
        return;
      }
      lock = true;
      say(msg, "memNo");
      timer = setTimeout(function () {
        a.up = b.up = false;
        a.el.classList.remove("up"); b.el.classList.remove("up");
        lock = false;
        label();
      }, 1000);
    }
    $("memNew").addEventListener("click", deal);
    deal();
    return { label: label };
  })();

  // ---------- Badge celebration ----------
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.hidden = true;
  document.body.appendChild(toast);
  var toastTimer = 0;
  document.addEventListener("cshl:badge", function (e) {
    var b = window.I18N[window.__lang || "en"].badges.filter(function (x) { return x.id === e.detail; })[0];
    if (!b) return;
    toast.hidden = true;
    void toast.offsetWidth; // restart the pop animation
    toast.textContent = b.icon + " " + fill(T("badgeNew"), { b: b.name });
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 3500);
    if (reduced) return; // no confetti under reduced motion
    var box = document.createElement("div");
    box.className = "confetti";
    box.setAttribute("aria-hidden", "true");
    var colors = ["#FFD447", "#58BDEB", "#087A45", "#FFFFFF"];
    for (var i = 0; i < 36; i++) {
      var s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.4 + "s";
      s.style.setProperty("--x", (Math.random() - 0.5) * 160 + "px");
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 2400);
  });

  // ---------- Language change ----------
  function refreshGames() {
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", T(el.getAttribute("data-i18n-aria"))); });
    msgEls.forEach(function (el) { if (el._msg) el.textContent = fill(T(el._msg[0]), el._msg[1]); });
    rotation.update();
    memory.label();
  }
  var baseRefresh = App.refresh;
  App.refresh = function () { baseRefresh(); refreshGames(); };
  refreshGames();
})();
