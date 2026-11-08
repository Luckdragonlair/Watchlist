# Watchlist splash and PC banner options

Status: **Proposed** (2026-11-08). Nothing here is connected to the app. Codex owns integration and the shared project ledger.

Open `index.html` for a side-by-side overview. Every preview works offline from this folder using relative paths.

## Approved for integration (owner, 2026-11-08)

**04 Brick alley, dark scene, with the reflective letter reveal, plus 07 Gold banner.**

Integrate these files:
- `shared/splash-core.css` and `shared/splash-core.js`
- `04-brick-alley/scene.css` and `04-brick-alley/brick.png`
- `07-gold-banner/banner.css`
- `fonts/limelight-400.woff2` and `fonts/limelight-OFL.txt`
- the splash markup from `04-brick-alley/splash.html`

Do not add the `wl-splash--lit` class. 05, 06 and 01–03 are for reference only.

## Round 2: options 04–07, from the owner's brief

Owner's brief, as given in chat on 2026-11-08:
- A spotlight reveals gold Watchlist lettering that cannot be seen until the light reaches it. Three scenes: a dark brick alley (no curtain), a movie screen behind red velvet curtains, and a stage with the letters hung as a set piece.
- As close to realistic as code allows, with no photos. Real colours inside the scene fade to the app's navy at the edges.
- The word area starts completely dark. One bright spotlight sweeps left to right, and each letter appears as the beam reaches it, until the whole word is visible. The word then flares white and the light dies down, leaving the gold logo. (The eye in the "a" was tried and dropped at the owner's request.)
- The gold logo then flies up and becomes the top banner title.
- 5 seconds, plays every time the app opens, no sound. **No skip** (owner, 2026-11-08: short enough to play in full). An earlier hold-to-skip ring was removed.
- Banner: bold gold theatre-sign lettering, no bulbs, slight slant, centred across the full width, transparent background. Account and Up to date overlay it at the right on PC; on phone they sit on a row below. The same banner appears on Android.
- **Owner chose 04 Brick alley (2026-11-08).** Phone portrait and landscape versions are now in `04-brick-alley/phone.html`. The same `scene.css` covers PC, portrait and landscape through media queries. 05 and 06 are kept for reference only.

**Lighting (owner feedback, 2026-11-08):** the owner prefers the **dark scene**, which is now the default. The lit variant is still available: tick "Lit scene" in a preview, open it with `?light=lit`, or add the `wl-splash--lit` class.

**Letter reveal (owner feedback):** the letters are physically on the wall from the start but invisible in the dark. As the beam crosses them they catch the light: the hot centre of the beam makes each letter flare and reflect. Once the beam has passed, each letter stays softly lit, so the whole word is visible at the end.

**Conflict to record:** AGENTS.md asks for a brief, nonblocking reveal. The owner has now chosen a 5-second splash that plays on every launch and cannot be skipped. Codex should record this decision in the ledger.

### Files
- `shared/splash-core.css`: shared timeline, dark, spotlight and glint layers, per-letter gold reveal, flash and fly-up
- `shared/splash-core.js`: shared runtime with no dependencies. It clones the scene into dark and spotlight layers, times each letter to the beam (scene sets `--sweep-delay` / `--sweep-dur`), centres the flash on the word and flies the logo onto `[data-wl-banner-title]`
- `04-brick-alley/` **(chosen)**: `scene.css`, `brick.png` (generated texture, 1920×1080), `splash.html` (PC preview), `phone.html` (portrait 412×915 and landscape 915×412 previews)
- `05-movie-screen/`: `scene.css`, `curtain.png` (generated velvet tile), `splash.html`
- `06-stage-set/`: `scene.css`, `curtain.png`, `floor.png` (generated), `splash.html`
- `07-gold-banner/`: `banner.css`, `banner.html` (preview at PC 1440, phone portrait and phone landscape)
- `fonts/limelight-400.woff2` + `limelight-OFL.txt`: the gold lettering font (Google Fonts, SIL Open Font License)
- `preview/app-mock.css`, `preview/app-mock.html`: stand-in app page for previews only

In each `splash.html` the controls at the bottom left are for preview only: Replay, Dark scene, Reduced motion, and a scrubber covering 0–5.1s.

### Integration requirements (Round 2)
1. **Font.** Add `limelight-400.woff2` to `public/fonts` with its OFL licence, an `@font-face` rule for `'Limelight'`, and the file to the hosted-build font allowlist and offline cache.
2. **Markup.** Copy the `<template id="splash-tpl">` contents from the chosen `splash.html`. Mount it as early as possible: static in `index.html` before `#root`, with CSS in `<head>`. Then call `WLSplash.start(el)`. Scene images must be served beside `scene.css`, or the `url()`s adjusted.
3. **Banner.** Replace the current Account / Up to date rows with `<header class="wl-topbar">` using `.wl-topbar__title` (with `data-wl-banner-title`) and `.wl-topbar__status`, as in `preview/app-mock.html`. The splash hides that title while it runs and reveals it once the flying logo lands. Whether the existing small W + "Watchlist" brand in the nav stays is Codex's or the owner's call. With the banner it repeats the name.
4. **No skip.** The splash ignores input and removes itself after about 5.1s. It never moves focus. A safety timer also restores the banner title.
5. **Reduced motion.** The scene is shown fully lit and still with the logo, then fades out after about 1.6s. There is no sweep, flash or fly-up. Forced-colours mode hides the splash.
6. **Manifest colours.** Still required, see item 5 under Round 1 below.
7. **Performance.** Three full-screen copies of the scene with masks. Check on the owner's Android phone. If it stutters, reduce the size of `brick.png` or drop the side walls.

---

## Round 1 (superseded, kept for reference): options 01–03

## Context used

- `AGENTS.md`: Nightfall V2 baseline; owner concept of a movie-style spotlight revealing Watchlist; must be a brief, nonblocking reveal with a static reduced-motion state.
- `design/nightfall-v2/Watchlist Directions.dc.html`: app icon (W + HUD tick ring), reused in options 02 and 03.
- `src/style.css`, `src/fonts.css`: colours (`#05070d`, `#e4e9f4`, `#a3afc6`, `#8dd9ff`, `#2c3b54`) and font-family names, which the CSS here matches.
- `artifacts/nightfall-1280.png`, `artifacts/compact-phone-header.png`: the current look, copied into `preview/` as preview backdrops only.

## Options

Each option has a splash (animated, full-screen overlay) and a matching static PC banner.

### 01 · Spotlight sweep (`01-spotlight-sweep/`)
A spotlight crosses a dark panelled wall, finds the wordmark, settles. 2.7s total (fade-out starts at 2.25s).

- `splash.css` — production-reference CSS (all classes prefixed `wl-splash`)
- `wall.svg` — text-free panelled wall texture used by the splash
- `banner.svg` — text-free banner background (light pool behind the left-side wordmark)
- `banner.css` — banner layout (shared, identical in all three options)
- `splash.html`, `banner.html` — previews only

### 02 · Projector screen (`02-projector-screen/`)
A projector beam flickers on, the screen lights, the wordmark pulls into focus inside the icon's tick ring. 2.6s.

- `splash.css`, `banner.svg`, `banner.css`, `splash.html`, `banner.html`
- No image needed for the splash; it is all CSS.
- Note: the beam flicker is a few quick opacity steps in the first 0.4s. It stays well under 3 flashes per second at low contrast, but if the owner is sensitive to flicker, smooth it (change `steps(1,end)` to `ease-out`).

### 03 · Quiet ring (`03-quiet-ring/`)
Icon mark settles, tick ring turns into place, horizon line draws out, wordmark rises. 1.9s. Least motion; can also replace the reduced-motion frame of 01 or 02.

- `splash.css`, `banner.svg`, `banner.css`, `splash.html`, `banner.html`

### Shared
- `fonts/` — copies of the app's own WOFF2 files and OFL licences, so previews render offline. **Do not integrate**; the app already ships these.
- `preview/` — preview harness (`preview.css`, `harness.js`) and two fixture screenshots. **Preview only.**
- `index.html` — overview of all three.

## Splash markup

Copy the markup from the `<template id="splash-tpl">` in the chosen option's `splash.html`. It is decorative and `aria-hidden="true"`; the wordmark is live text (Instrument Serif), so no font-to-path images are needed.

## Integration requirements (for Codex — all outside this folder)

1. **Placement.** Put the splash markup in `index.html` before `#root`, and its CSS inline in `<head>` (or a small preloaded stylesheet), so it paints before the JS bundle loads. Option 01 also needs `wall.svg` served from `public/` (or inlined as a data URI).
2. **Nonblocking.** The splash must never delay library access:
   - Remove it when its fade-out ends (`animationend` on `.wl-splash` with `animationName === 'wl-splash-out'`), or immediately when the app is ready if that comes later.
   - Any `pointerdown` or `keydown` adds `wl-splash--dismiss` (0.2s fade), then removes the node.
   - Do not trap focus or move focus into it. Keyboard focus should land in the app as normal.
   - Recommendation: play once per app launch/session, not on in-app navigation or service-worker update reloads. Where to store that flag is Codex's call.
3. **Reduced motion.** Handled in CSS by `@media (prefers-reduced-motion: reduce)`: a static lit frame, shown about 0.9s, then a 0.3s fade. `.wl-splash--reduced` is the same thing as a class (used by the preview toggle; optional in the app).
4. **Forced colours / high contrast.** The splash hides itself (`display:none`).
5. **Manifest colours (important).** Android shows its own system splash (icon + name + `background_color`) before any page loads. The current manifest has `background_color: #f5f5f5` and `theme_color: #202020`, which will flash light grey before the dark splash. Change both to `#05070d` in `public/manifest.webmanifest`, and `<meta name="theme-color">` in `index.html` to `#05070d`. This system splash cannot be replaced by a custom image on Android PWAs.
6. **Icons.** The Android system splash will show the current temporary W icon until the approved Nightfall icon (Directions file) replaces `public/icons/*`. That is separate approved V2 work, not part of this folder.
7. **PC banner.**
   - Wrap the existing desktop header in an element with class `wl-banner` and serve the chosen `banner.svg` beside `banner.css` (or adjust the `url()`).
   - Banner applies at 1200px and wider; below that `banner.css` removes the image and extra height so the existing compact-desktop and phone headers are unchanged.
   - The background is decorative. Keep the real `<h1>`, nav and backup buttons as they are; `wl-banner__top / __brand / __word` classes are suggestions for the two-row layout shown in the preview, which puts the wordmark at 60px in the light pool and moves the nav to a second row.
   - At 200% text the header grows naturally (min-height only, no fixed height). Check that the nav still wraps cleanly.
   - Confirm contrast of nav text over the lit areas when integrated; the light pools sit behind the wordmark, not the nav, at all widths ≥1200.
8. **Fonts.** CSS uses the app's existing family names: `'Instrument Serif'`, `'IBM Plex Mono'`. No new font files.
9. **No dependencies.** Pure CSS + SVG; no JS libraries, no remote requests.

## Not included

- No raster PNG exports; the SVGs scale and are text-free. Ask if PNGs are needed (e.g. for a README or store listing).
- No changes to app code, manifest, icons, service worker or shared docs.
