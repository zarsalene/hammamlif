// Checks that every data-i18n key in index.html exists in en, fr and ar, and that the three ui sets match.
// Run: node tests/i18n.test.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {} };
vm.createContext(ctx);
for (const lang of ["en", "fr", "ar"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "js/lang", lang + ".js"), "utf8"), ctx);
}
const I18N = ctx.window.I18N;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const used = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]))];

const errors = [];
for (const lang of ["en", "fr", "ar"]) {
  for (const key of used) if (!(key in I18N[lang].ui)) errors.push(`missing ${lang}:${key}`);
}
const enKeys = Object.keys(I18N.en.ui).sort().join();
for (const lang of ["fr", "ar"]) {
  if (Object.keys(I18N[lang].ui).sort().join() !== enKeys) {
    const a = Object.keys(I18N.en.ui), b = Object.keys(I18N[lang].ui);
    a.filter((k) => !b.includes(k)).forEach((k) => errors.push(`only in en, not ${lang}: ${k}`));
    b.filter((k) => !a.includes(k)).forEach((k) => errors.push(`only in ${lang}, not en: ${k}`));
  }
}
if (errors.length) {
  console.error("i18n FAIL\n" + errors.join("\n"));
  process.exit(1);
}
console.log(`i18n OK: ${used.length} keys used, ${Object.keys(I18N.en.ui).length} keys per language`);
