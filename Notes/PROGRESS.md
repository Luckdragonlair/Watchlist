# Watchlist v0.1 checkpoint

Verified: 2026-11-05 (America/Chicago). Project: `D:\Watchlist`.

## Delivered

React + TypeScript + Vite; IndexedDB via Dexie with separate show, season, episode, viewing, preference and source records. Plain placeholder UI. TVmaze explicit search/import and atomic metadata refresh; episode check-off/automatic advance/undo; current-episode catch-up; Weekly/Binge/Watched; show details; personal notes; persistent Binge arrow ordering; backup export.

Added Delete show in detail, with confirmation. One database transaction removes show/season/episode/history/preferences and linked source rows. Source markers prevent seed resurrection; ambiguous unrelated same-name source entries are retained. Old history gains ownership during schema v2 upgrade; orphaned legacy episode IDs are resolved through TVmaze before deletion or deletion fails safely. Deleted records cannot return through stale refresh, undo, or an in-flight source match. Tests use disposable libraries; no user show was deleted during development. Original master and existing backup files stay preserved.

Original master and five original planning files preserved separately under `originals/`. Root master unchanged. SHA-256: `6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be`.

Separate starting catalog: 301 installments across 208 distinct titles, no Silo. All 5 Silo source rows omitted. Original season labels, source classifications and notes preserved; uncertain claims remain unverified. Each series needs positive TVmaze candidate selection before episode linking. Source watched-season assertions are applied only to released regular episodes. A seasonless Watched assertion requires explicit scope confirmation.

## Verification

- From `D:\Watchlist`: 29 unit/database tests PASS; TypeScript and Vite production build PASS.
- From `D:\Watchlist`: 8 Edge browser workflows PASS: search/import/check-off/reload/undo/completion/offline error safety; bulk Silo exclusion; real catalog plus mobile width; generic mid-season onboarding and refresh safety; seasonless watched scope confirmation; completed backlog season and future premiere placement; delete cancellation/cascade/export/reload/clean re-add; concurrent source-import deletion safety.
- Live TVmaze search/season/episode sample recorded in `TVMAZE_LIVE_CHECK.json`. Ghosts has multiple exact-name candidates; DAN DA DAN has a different provider spelling. Neither was silently selected.
- Live isolated-browser import of Severance #44933 PASS: first episode checked, next episode advanced, progress survived reload. Results in `LIVE_APP_SMOKE.json`. This did not change the user's normal browser library or touch Silo.
- Desktop/mobile placeholder screenshots are in `artifacts/`. Browser tests use disposable contexts, not the user's saved library.

## Run / handoff

Open `http://127.0.0.1:5174/` while the server is running. Later, from the project folder, run `./run-watchlist.ps1`; standard alternative: `pnpm dev`. Keep the same address/browser for the same IndexedDB library. See `RUN.md`.

Use GPT-6.1 Sol Medium for routine next changes; reserve High for tricky data/import rules or difficult failures. Use Chat for feature discussion, then hand implementation back with this file and TODO/DECISIONS. Claude owns final visuals. Two focused helpers reviewed data safety/run instructions; findings were corrected and tested.

## Outstanding

Manual follow-up: the user confirmed Delete show worked in their browser. They also reported Silo advancing from S3 E8 to E9 and returning to E8. The user then confirmed page reload preserves E8 as next, both E8/E9 unchecked, and earlier episodes watched. These core onboarding/progress checks pass by user report; the full Silo acceptance test still has outstanding checks. No user progress was changed by the assistant during this follow-up.

- `Re S3` / `Re S4` need the user's title identification. Other titles need positive series mapping; original master schedule/status claims need independent verification.
- Silo was held out of the seed and has now been manually added by the user. The user selected S3 E8 (superseding the planned S2 E8) and confirmed earlier episodes were marked done. The manual test is IN PROGRESS, not a full PASS. A Friday placement defect was fixed: future S4 must not pull a fully released S3 backlog into Weekly; unstarted seasons remain outside Weekly until first release. Saved viewing state was not altered. See TEST_CASE_SILO.md.
- Installable PWA/offline reload, backup restore, drag-and-drop, recommendations, specials and final design are follow-ups. Watched retains partial title history; richer installment-level organization is pending. Git now connects this working folder to Luckdragonlair/Watchlist; no deployment created.
- User's later spelling-search idea is recorded in TODO only; no external-site lookup/URL import feature was added.

No remaining installation/build/test blocker at this checkpoint. The app catalog is imported as source data; full TVmaze mapping is intentionally not claimed complete.

## GitHub Desktop connection — 2026-11-05

The user cloned the private Luckdragonlair/Watchlist repository into D:\Watchlist-GitHub. Its clean main/origin history (README checkpoint 24b1da8) was copied into D:\Watchlist\.git so the existing app remains the working copy. Both folders and the original app files were preserved. No commit, push, or remote file change was performed. GitHub Desktop should now add D:\Watchlist through File > Add local repository, review the app changes, commit the v0.1 checkpoint, then Push origin. Use D:\Watchlist for future development.