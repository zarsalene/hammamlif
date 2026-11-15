# Pro-club + kids redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the one-page CSHL academy site into a pro-club layout with kids' energy, and add Programmes, Venues, stats strip, CTA band and mobile register bar.

**Architecture:** Same static files. `index.html` gets new sections; `css/styles.css` gets new tokens and section styles; new text lives in `js/lang/{en,fr,ar}.js` under `ui`. No new JS behavior except none needed (anchors only).

**Tech Stack:** HTML, CSS, vanilla JS, Google Fonts, Node 24 (test script), headless Chrome (screenshots).

**Spec:** `docs/superpowers/specs/2026-11-15-pro-kids-redesign-design.md`

## Global Constraints
- Colors: `--night: #053D26`, `--green: #087A45`, `--yellow: #FFD447`, `--sky: #58BDEB`.
- Fonts: headings `"Barlow Condensed", "Cairo"` 700/800 uppercase; body `"Nunito", "Cairo"`. Remove Fredoka.
- Photos: `img/hero.jpg`, `img/u7.jpg`, `img/u10.jpg`, `img/u13.jpg`, `img/venue.jpg`; each slot = `background: url(photo) center/cover, <court pattern>` so a missing file shows the pattern.
- No Man City assets/text. No invented venue facts: placeholder text says to replace it.
- Every `data-i18n` key exists in en, fr and ar.
- Not a git repo: skip commit steps.

## Review Focus
- Arabic (RTL): new cards, strip, sticky bar mirror correctly; uppercase does not apply to Arabic (`[dir=rtl]` resets `text-transform`).
- Phone width 360px: no horizontal scroll; sticky bar does not cover the footer/last button (body bottom padding).
- Keyboard: header CTA and programme buttons reachable, visible focus ring on dark green.
- `prefers-reduced-motion`: ball and hover pops stop (existing rule must still cover new animations).
- Existing quiz/game/badges/lessons still render after language switch.

---

### Task 1: i18n key-parity test

**Files:** Create `tests/i18n.test.js`

- [ ] Step 1: Script loads the three lang files in a `vm` context with `window = {}`, collects all `data-i18n="..."` keys from `index.html`, and fails (exit 1, lists `lang:key`) if any key is missing from `I18N[lang].ui`. Also fails if `ui` key sets differ between languages.
- [ ] Step 2: Run `node tests/i18n.test.js` → expected PASS on current site ("i18n OK: N keys").

### Task 2: Tokens, fonts, header

**Files:** Modify `index.html` (head font link, header), `css/styles.css` (`:root`, base, header)

- [ ] Step 1: Add header CTA `<a href="#register" class="btn btn-primary header-cta" data-i18n="ctaTrial">` and keys `ctaTrial` (EN "Book a free trial") in all 3 langs. Run test → FAIL until keys added, then PASS.
- [ ] Step 2: Swap font link to Barlow Condensed 600;700;800 + Nunito + Cairo. Tokens per Global Constraints; header background `--night`, h1/h2 uppercase Barlow, tight letter-spacing.
- [ ] Step 3: Screenshot 1280 + 390 (Task 6 command) — header fits one row on desktop, hamburger on phone.

### Task 3: Hero + stats strip

**Files:** Modify `index.html` hero, `css/styles.css`

- [ ] Step 1: Hero = full-width photo slot (`.hero` bg uses `img/hero.jpg` over green overlay gradient + court pattern), min-height `min(88vh, 760px)`, keep bouncing ball as a sticker, keep both buttons.
- [ ] Step 2: After hero add `<ul class="stats">` with 4 items, keys `stat1..stat4` + `stat1l..stat4l` (EN: "1944" / "Club founded", "5-12" / "Years old", "3" / "Age groups", "Free" / "First session"). Run test → PASS after adding keys.

### Task 4: Programmes + Venues sections

**Files:** Modify `index.html` (insert after stats, before `#discover`), `css/styles.css`, lang files; add nav links `navPrograms`, `navVenues`.

- [ ] Step 1: `#programmes`: 3 `article.prog-card` (photo slot `u7/u10/u13`, sticker age tag reusing keys `ageU7/ageU10/ageU13`, title, 1-line text, `btn` to `#register` with `ctaTrial`). Keys: `progTitle`, `progLead`, `prog1t..prog3t`, `prog1..prog3`.
- [ ] Step 2: `#venues`: 1 `article.venue-card` (photo slot `venue.jpg`, name `venueName`, address `venueAddr` = placeholder "Address to be added — Hammam-Lif, Tunisia", days `venueDays` = placeholder, link "Directions" `venueDir` → `https://www.google.com/maps/search/?api=1&query=Hammam-Lif+Tunisia`, `target=_blank rel=noopener`). Keys `venuesTitle`, `venuesLead`.
- [ ] Step 3: Run test → PASS.

### Task 5: Restyle existing sections + CTA band + sticky bar

**Files:** Modify `index.html`, `css/styles.css`, lang files

- [ ] Step 1: Cards: white, 16px radius, colored sticker dot/tag (`--c`), hover lift + slight rotate; section titles uppercase with yellow underline kept; `.alt` sections use soft green.
- [ ] Step 2: Replace register section heading area with green `.cta-band` (big uppercase title `bandTitle` EN "Ready to play?", button `ctaTrial`); keep existing email panel below.
- [ ] Step 3: `.mobile-bar` fixed bottom, visible only ≤760px, button `ctaTrial`; `body { padding-bottom }` at that width.
- [ ] Step 4: Run test → PASS.

### Task 6: Verify

- [ ] Step 1: `node tests/i18n.test.js` → PASS.
- [ ] Step 2: Headless Chrome screenshots: `chrome --headless --screenshot=out.png --window-size=1280,4000 file:///.../index.html` and `--window-size=390,6000`; plus Arabic (`localStorage` cannot be preset → add `?lang=ar` support? No: check AR by temporary copy of en→ar default is out of scope; instead test RTL by screenshot of a scratch copy with `dir="rtl"`).
- [ ] Step 3: Inspect screenshots: no overflow, fallback patterns show, CTAs visible.
- [ ] Step 4: Run `ui-ux-review` skill on the change.
