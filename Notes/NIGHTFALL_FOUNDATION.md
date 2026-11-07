# Nightfall V2 foundation

Status: first presentation milestone verified; complete V2 implementation remains in progress.

## Delivered

- Approved references preserved unchanged in design/nightfall-v2, including CHANGES.md and support.js.
- Deep navy surfaces, faint grid and blue glow; Instrument Serif headings, IBM Plex Sans controls and IBM Plex Mono metadata. Eight WOFF2 Latin font faces and three OFL licenses are local/offline assets; other glyphs use system fallbacks.
- Cards show full wrapping titles, a written genre label, service, an explicit visible Mark S/E watched action, watched-episode progress and remaining availability. Decorative letter panels do not claim to be show posters.
- Existing up/down ordering controls are on the right edge, vertically centered, with 44-pixel targets. They still use the original saved-order transaction.
- Windows navigation/backup controls; phone bottom navigation for Weekly, Binge, Watched and Add Show, with Import separately reachable. Search remains available on phone. Account information collapses after sign-in; sync conflict and error controls remain reachable.
- Focus outlines, reduced-motion handling, native progress semantics, dark system controls and forced-color outlines.
- Hosted build copies only an explicit font allowlist. The original private master remains excluded; static fonts are cached by the existing versioned service worker.

## Verification

TypeScript and 195 unit tests passed. All 14 existing browser workflows passed; an additional fictional long-title test passed at 320, 412, 640, 960 and 1280 pixels, checking overflow, search, bottom navigation, centered arrow positions, touch sizes, focus and reduced motion. Five existing PWA tests and a new offline-font reload test passed. Hosted unsigned sign-in/privacy test and both builds/privacy guard passed. Desktop/phone fixture screenshots were inspected. These automated browser results use Edge; real Firefox/Android visual acceptance is still required. The 640-pixel layout is narrow-layout coverage, not proof of real browser zoom or enlarged text.

No new database migration, viewing-state mutation, sync protocol change, matching rule or real-device data injection. Preserved prior interface files under originals/before-nightfall-2026-11-07. The existing deployed sync code was first saved in a separate ordinary Git checkpoint; Nightfall is a separate presentation checkpoint.

## Remaining approved V2 work

1. Ready / Upcoming & TBA / Not for me, and Watching now / Watch soon / Everything else. Requires a deliberate persistent preference model and backward-compatible backup/sync validation, rather than cosmetic nonfunctional tabs.
2. Mouse, touch and keyboard drag-and-drop sharing arrow order; movement announcements and pinned section headings.
3. Production A-Z adjustable control with the full AGENTS.md accessibility contract.
4. Final screen/detail/dialog/status layout and application icons. Automatic 30-day recovery copies and recommendations remain separate deferred features.
5. Actual Firefox/Android visual checks, zoom/text sizes, keyboard and TalkBack/NVDA acceptance. Existing generic functional tests do not substitute for these.

The foundation is ready for the owner to review. Keep the next changes focused on Binge organization before adding dragging. See Notes/ROADMAP.md for remaining effort estimates.


## Published - 2026-11-07 08:23 CST

Published only Firebase Hosting for genre-watchlist. Live isolated signed-out Edge check passed: Nightfall colors, three locally loaded font families, cached font allowlist, private-master exclusion, no Watchlist database before sign-in, phone width without overflow and zero page errors. Existing signed-in devices need to accept Update and reload; signed-in visual acceptance is still requested from the owner. No database rules, billing or viewing records were changed by this release.
