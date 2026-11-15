# Pro-club + kids redesign — design

Date: 2026-11-15 · Status: approved by user ("go")

## Intent
Make the CSHL Volleyball Academy one-page site look like a professional club programme site
(reference: mancity.com/football-programs/uk/manchester/venues/) while staying fun for kids under 13,
so parents and kids want to sign up.

## Goals
- Pro structure: dark sticky header with an always-visible CTA, big photo hero, programme cards, venue cards.
- Kids feel: bouncing ball, playful press-down buttons, colored stickers, hover pop, games kept.
- More sign-ups: "Book a free trial" CTA in header, hero, each programme card, final band; sticky register bar on phones.
- EN / FR / AR kept, RTL works.

## Non-goals / anti-goals
- No copy of Man City logo, text, colors or exact layout. Ideas only.
- No frameworks, build step or new JS libraries. Static HTML/CSS/vanilla JS stays.
- No invented facts (venue address, training days, prices). Unknown facts stay as visible placeholders.
- Do not break existing quiz, mini-game, challenge, badges, lessons, i18n.

## Approaches
1. **Pro club look (picked).** Restyle the whole page + add Programmes, Venues, stats strip, CTA band.
2. Light touch: only add venue cards + header CTA. Rejected: does not match the reference.
3. Full Man City clone. Rejected: brand copy, and too cold for kids.

## Decisions
- Colors: dark green `#053D26` (navy role), CSHL green `#087A45`, yellow `#FFD447` (accent role), sky `#58BDEB` as second kid color.
- Fonts: headings Barlow Condensed 700/800 uppercase (sporty); body Nunito; Arabic Cairo. Fredoka dropped.
- Photos: slots read from `img/` (`hero.jpg`, `u7.jpg`, `u10.jpg`, `u13.jpg`, `venue.jpg`). Missing photo → green court-pattern fallback via CSS background layering (photo on top of pattern).
- New i18n keys added to all three language files.

## Left to the builder
Exact spacing, card details, animation timing, within the tokens above.

## Open (user to provide)
Gym address, training days, real photos, real contact email.
