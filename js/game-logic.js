// Pure game rules (no DOM). Used by app.js and games.js in the browser, and by tests/games.test.js in node.
(function (root) {
  // Fisher-Yates shuffle. Returns a new array; rnd is optional (tests pass a seeded one).
  function shuffle(arr, rnd) {
    rnd = rnd || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Keep it up: a tap counts when it lands within 1.7 x the ball radius (generous for small fingers).
  function hitBall(px, py, bx, by, r) {
    var dx = px - bx, dy = py - by, reach = r * 1.7;
    return dx * dx + dy * dy <= reach * reach;
  }
  // Game speed multiplier: +5% per hit, capped so the game stays playable.
  function keepSpeed(hits) { return Math.min(2, 1 + 0.05 * hits); }

  // Serve: power p in [0, 1] from the meter picks where the ball lands.
  var SERVE_ZONES = [[0.12, "net", 0], [0.4, "short", 1], [0.7, "mid", 2], [0.9, "deep", 3], [Infinity, "out", 0]];
  function serveZone(p) {
    for (var i = 0; i < SERVE_ZONES.length; i++) {
      if (p < SERVE_ZONES[i][0]) return { zone: SERVE_ZONES[i][1], pts: SERVE_ZONES[i][2] };
    }
  }

  // Block: time (ms) to react; shrinks with each block, never below 600 ms.
  function blockWindow(blocks) { return Math.max(600, 1500 - 60 * blocks); }
  var BLOCK_KEYS = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 1, ArrowRight: 2 };

  // Rotation: spots 1 to 6 (1 = back right, server; 2 = front right; 3 front middle;
  // 4 front left; 5 back left; 6 back middle). Clockwise: each player moves to spot - 1, and 1 goes to 6.
  function nextSpot(spot) { return spot === 1 ? 6 : spot - 1; }
  // team[i] is the player on spot i + 1. Returns the team after one clockwise rotation.
  function rotate(team) {
    var out = [];
    team.forEach(function (player, i) { out[nextSpot(i + 1) - 1] = player; });
    return out;
  }

  // Memory: one name card and one picture card per skill.
  var SKILLS = ["bump", "set", "spike", "serve", "block", "dig"];
  function makeDeck(skills, rnd) {
    var cards = [];
    skills.forEach(function (s) { cards.push({ skill: s, kind: "name" }, { skill: s, kind: "pic" }); });
    return shuffle(cards, rnd);
  }
  function isPair(a, b) { return a !== b && a.skill === b.skill && a.kind !== b.kind; }

  var api = {
    shuffle: shuffle, hitBall: hitBall, keepSpeed: keepSpeed, serveZone: serveZone,
    blockWindow: blockWindow, BLOCK_KEYS: BLOCK_KEYS, nextSpot: nextSpot, rotate: rotate,
    SKILLS: SKILLS, makeDeck: makeDeck, isPair: isPair
  };
  root.GameLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
