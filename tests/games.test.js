// Checks the pure game rules in js/game-logic.js and the game text keys in all 3 languages.
// Run: node tests/games.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const G = require(path.join(root, "js/game-logic.js"));

// Seeded random so shuffle results are repeatable.
function seeded(seed) {
  return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

const tests = {
  "shuffle keeps every item and does not change the input"() {
    const input = [0, 1, 2, 3, 4];
    const out = G.shuffle(input, seeded(7));
    assert.deepStrictEqual(input, [0, 1, 2, 3, 4]);
    assert.deepStrictEqual(out.slice().sort(), [0, 1, 2, 3, 4]);
  },
  "shuffle moves the right answer around (not always the middle)"() {
    const rnd = seeded(42), seen = new Set();
    for (let i = 0; i < 30; i++) seen.add(G.shuffle([0, 1, 2], rnd).indexOf(1));
    assert.deepStrictEqual([...seen].sort(), [0, 1, 2]);
  },
  "hitBall: generous radius around the ball, misses far away"() {
    assert.ok(G.hitBall(100, 100, 100, 100, 30));
    assert.ok(G.hitBall(145, 100, 100, 100, 30)); // 45px away, inside 1.7 x 30
    assert.ok(!G.hitBall(160, 100, 100, 100, 30));
    assert.ok(!G.hitBall(0, 0, 100, 100, 30));
  },
  "keepSpeed grows with each hit and has a ceiling"() {
    assert.strictEqual(G.keepSpeed(0), 1);
    assert.ok(G.keepSpeed(5) > G.keepSpeed(4));
    assert.strictEqual(G.keepSpeed(1000), G.keepSpeed(2000));
  },
  "serveZone: net, short, mid, deep, out and their points"() {
    const z = (p) => { const r = G.serveZone(p); return r.zone + r.pts; };
    assert.deepStrictEqual([0, 0.11, 0.12, 0.39, 0.4, 0.69, 0.7, 0.89, 0.9, 1].map(z),
      ["net0", "net0", "short1", "short1", "mid2", "mid2", "deep3", "deep3", "out0", "out0"]);
  },
  "blockWindow shrinks as the score rises, with a floor; arrow keys map to zones"() {
    assert.ok(G.blockWindow(5) < G.blockWindow(0));
    assert.strictEqual(G.blockWindow(100), G.blockWindow(200));
    assert.ok(G.blockWindow(100) >= 500);
    assert.deepStrictEqual(["ArrowLeft", "ArrowDown", "ArrowRight"].map((k) => G.BLOCK_KEYS[k]), [0, 1, 2]);
  },
  "rotation is clockwise: 2 goes to 1, 1 goes to 6, 6 turns bring the team back"() {
    assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map(G.nextSpot), [6, 1, 2, 3, 4, 5]);
    const team = ["A", "B", "C", "D", "E", "F"]; // team[i] is the player on spot i + 1
    const once = G.rotate(team);
    assert.strictEqual(once[0], "B"); // player from spot 2 now serves from spot 1
    assert.strictEqual(once[5], "A"); // server moves to spot 6
    let t = team;
    for (let i = 0; i < 6; i++) t = G.rotate(t);
    assert.deepStrictEqual(t, team);
  },
  "memory deck has one name and one picture per skill; isPair matches only those"() {
    const deck = G.makeDeck(["bump", "set", "spike"], seeded(3));
    assert.strictEqual(deck.length, 6);
    const name = deck.find((c) => c.skill === "set" && c.kind === "name");
    const pic = deck.find((c) => c.skill === "set" && c.kind === "pic");
    const other = deck.find((c) => c.skill === "bump" && c.kind === "pic");
    assert.ok(G.isPair(name, pic));
    assert.ok(!G.isPair(name, other));
    assert.ok(!G.isPair(pic, pic));
  },
  "game text keys, badges and quiz exist in en, fr and ar"() {
    const ctx = { window: {} };
    vm.createContext(ctx);
    for (const l of ["en", "fr", "ar"]) vm.runInContext(fs.readFileSync(path.join(root, "js/lang", l + ".js"), "utf8"), ctx);
    const I = ctx.window.I18N;
    const src = fs.readFileSync(path.join(root, "js/games.js"), "utf8");
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const ids = new Set([...html.matchAll(/ id="(\w+)"/g)].map((m) => m[1]));
    // Every camelCase string in games.js is a text key, unless it is an element id.
    const keys = new Set([
      ...[...src.matchAll(/"([a-z]+[A-Z]\w*)"/g)].map((m) => m[1]).filter((k) => !ids.has(k)),
      ...[...src.matchAll(/"@(\w+)"(?!\s*\+)/g)].map((m) => m[1]),
      ...[...html.matchAll(/data-i18n-aria="(\w+)"/g)].map((m) => m[1]),
      ...G.SKILLS.flatMap((s) => ["sk", "pic"].map((p) => p + s[0].toUpperCase() + s.slice(1)))
    ]);
    for (const l of ["en", "fr", "ar"]) {
      for (const k of keys) assert.ok(k in I[l].ui, `missing ${l}:${k}`);
      assert.strictEqual(I[l].quiz.length, 10, `${l} quiz needs 10 questions`);
      I[l].quiz.forEach((q, i) => assert.ok(q.c >= 0 && q.c < q.a.length && q.c === I.en.quiz[i].c, `${l} quiz ${i}`));
      assert.deepStrictEqual(I[l].badges.map((b) => b.id), I.en.badges.map((b) => b.id));
    }
    for (const id of ["keep25", "serve5", "block10", "rotate", "memory"]) {
      assert.ok(I.en.badges.some((b) => b.id === id), "badge " + id);
      assert.ok(src.includes('earn("' + id + '")'), "earn " + id);
    }
  }
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log("PASS " + name); } catch (e) { failed++; console.log("FAIL " + name + "\n  " + e.message); }
}
console.log(failed ? `games FAIL: ${failed} of ${Object.keys(tests).length}` : `games OK: ${Object.keys(tests).length} tests`);
process.exit(failed ? 1 : 0);
