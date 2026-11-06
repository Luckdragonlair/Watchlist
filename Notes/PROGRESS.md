# Watchlist v0.1 checkpoint

Verified: 2026-11-05 (America/Chicago). Project: `D:\Watchlist`.

## Delivered

React + TypeScript + Vite; IndexedDB via Dexie with separate show, season, episode, viewing, preference and source records. Plain placeholder UI. TVmaze explicit search/import and atomic metadata refresh; episode check-off/automatic advance/undo; current-episode catch-up; Weekly/Binge/Watched; show details; personal notes; persistent Binge arrow ordering; backup export and validated restore.

Added Delete show in detail, with confirmation. One database transaction removes show/season/episode/history/preferences and linked source rows. Source markers prevent seed resurrection; ambiguous unrelated same-name source entries are retained. Old history gains ownership during schema v2 upgrade; orphaned legacy episode IDs are resolved through TVmaze before deletion or deletion fails safely. Deleted records cannot return through stale refresh, undo, or an in-flight source match. Tests use disposable libraries; no user show was deleted during development. Original master and existing backup files stay preserved.

Original master and five original planning files preserved separately under `originals/`. Root master unchanged. SHA-256: `6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be`.

Separate starting catalog: 301 installments across 208 distinct titles, no Silo. All 5 Silo source rows omitted. Original season labels, source classifications and notes preserved; uncertain claims remain unverified. Each series needs positive TVmaze candidate selection before episode linking. Source watched-season assertions are applied only to released regular episodes. A seasonless Watched assertion requires explicit scope confirmation.

## Verification

- From `D:\Watchlist`: 100 unit/database/validation tests PASS; TypeScript and Vite production build PASS.
- From `D:\Watchlist`: 13 Edge browser workflows PASS: search/import/check-off/reload/undo/completion/offline error safety; bulk Silo exclusion; real catalog plus mobile width; generic mid-season onboarding and refresh safety; seasonless watched scope confirmation; completed backlog season and future premiere placement; delete cancellation/cascade/export/reload/clean re-add; concurrent source-import deletion safety; export feedback and re-download; restore preview/cancel and recovery of progress/notes; malformed restore refusal; empty restore persistence; and cross-tab restore/request safety.
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
- Installable PWA/offline reload, drag-and-drop, recommendations, specials and final design are follow-ups. Watched retains partial title history; richer installment-level organization is pending. Git now connects this working folder to Luckdragonlair/Watchlist; no deployment created.
- User's later spelling-search idea is recorded in TODO only; no external-site lookup/URL import feature was added.

No remaining installation/build/test blocker at this checkpoint. The app catalog is imported as source data; full TVmaze mapping is intentionally not claimed complete.

## GitHub Desktop connection — 2026-11-05

The user cloned the private Luckdragonlair/Watchlist repository into D:\Watchlist-GitHub. Its clean main/origin history (README checkpoint 24b1da8) was copied into D:\Watchlist\.git so the existing app remains the working copy. Both folders and the original app files were preserved. No commit, push, or remote file change was performed. GitHub Desktop should now add D:\Watchlist through File > Add local repository, review the app changes, commit the v0.1 checkpoint, then Push origin. Use D:\Watchlist for future development.
## Backup export feedback fix — 2026-11-05

The user's click did create C:\Users\carpa\Downloads\watchlist-backup.json. Read-only inspection found valid version-1 JSON with 2 shows, 39 episodes and 27 viewing-history records. No restore was performed and no viewing data was changed.

The old confirmation appeared at the top of the page, away from the footer button. Export now shows and scrolls its result into view beside the button, keeps a reusable download link, uses timestamped filenames, and reports preparation failures locally. It says the backup is ready rather than claiming the browser finished saving it. Download URLs remain available until replaced or the component closes. All six record collections are read in one database snapshot.

Validation: 30 unit/database tests passed; TypeScript/Vite build passed; 2 focused browser workflows passed (export contents/visible feedback/re-download and deletion/export regression). The prior full 8-workflow suite is recorded above; the new total suite contains 9 workflows, but only the two relevant workflows were rerun for this change. The initial v0.1 checkpoint 4fb09e3 was confirmed on GitHub; this feedback fix is currently local and has not been committed or pushed.

## Export button placement — 2026-11-05

Moved Export backup into the top controls, to the right of Weekly/Binge/Watched/Add Show/Import. Feedback and the repeat-download link remain beside it. On narrow screens it wraps beneath navigation without horizontal overflow. Verified desktop row alignment and 390px mobile layout in an isolated browser; export-download workflow and TypeScript/Vite build pass. No viewing data changed. This and the preceding export-feedback fix remain local pending the next commit/push.

## Validated backup restore — 2026-11-05

Restore backup is beside Export at the top right. Files are checked before a native dialog previews saved date and data counts. The user can export their current library from the preview, cancel without changes, or explicitly confirm full replacement. Restore is not a merge. All shows/seasons/episodes/viewing records/preferences/sources replace together in one transaction; any failure rolls back. Unknown facts remain unknown; legacy progress is mapped to known episode owners without guessing missing ownership.

Schema v3 stores internal catalog-initialization and library-revision flags. Restoring an empty library does not repopulate the master on reload. Revision checks protect restored data from pre-restore metadata requests, source matching, file uploads and legacy deletion lookups. Open tabs clear old detail/undo state when a restore revision changes.

Verification: 100 unit/database/validation tests passed; all 13 Edge browser workflows passed; TypeScript/Vite build passed. Desktop and mobile preview inspected; confirmation is disabled until the replacement checkbox is ticked. The user's existing Downloads backup was parsed read-only (2 shows / 39 episodes / 27 viewing records) and is compatible. All actual restores used disposable databases/browser contexts; no restore or replacement of the user's personal library was performed. A focused helper implemented/reviewed validation and flagged asynchronous restore races, which were fixed and tested.

The prior export improvements and this restore feature are included in the backup/restore checkpoint following 4fb09e3. See RUN.md for the new instructions. Remaining work includes full Silo acceptance follow-up, installable/offline app shell, drag-and-drop, recommendations and Claude's visual design.
Manual restore follow-up — 2026-11-05: the user reported that the backup restore flow seemed to work fine in their browser. Recorded as a successful user-reported check; the exact restored record counts and field-by-field state were not independently inspected. Automated round-trip/rollback/cancellation coverage remains as recorded above. No additional restore or data change was performed by the assistant.

## Backup/restore GitHub checkpoint — 2026-11-05

The user authorized committing and pushing the tested export/restore work as Add validated backup restore and improve backup controls. This checkpoint includes top-right backup controls, visible download feedback, validated preview-and-confirm restoration, atomic rollback, cross-tab protections, tests and updated instructions. Latest verification: 100 unit/database/validation tests and 13 browser workflows passed, with a passing TypeScript/Vite build. User-reported export/restore checks passed. Earlier pending-upload entries above describe historical stages; this checkpoint contains those changes. Commit and remote-upload verification are reported in the associated chat and Git history.
## Manual completion check — 2026-11-06

The user reported finishing The Handmaid's Tale: checking Episode 10 correctly marked it watched and placed it in Watched. Recorded as a successful user-reported completion/history check; season number, popup details, exact saved record counts and post-reload persistence were not separately inspected. No viewing records were changed by the assistant. Completion recommendations remain deferred, as the user noted; the existing target is to suggest what to watch next from the user's Binge entries.

## Offline/installable checkpoint — 2026-11-06

Added a manifest, generic W-box icons, production-only service worker registration, offline readiness/connectivity status, install prompt/guidance and explicit Update and reload. The deterministic post-build worker precaches the shell, assets and starter catalog. It does not cache TVmaze/runtime APIs or write viewing state. New versions wait while old clients are active; choosing Update and reload activates immediately, while closing all app windows also permits normal activation. Failed installs leave the existing offline version intact; cleanup touches only Watchlist's own scope caches.

Normal production use remains http://127.0.0.1:5174, preserving the user's origin and IndexedDB library. The default run-watchlist.ps1 builds and starts production. Development is now 5175 with separate data and no offline worker. Existing metadata/history schema was not changed for this work. No restore or edit of user viewing records was performed. The production server is running at 5174; the user must refresh and wait for Available offline. Actual OS-level installation has not been performed or claimed. See OFFLINE.md.

Verification from D:\Watchlist: 100 unit/database/validation tests, all 13 existing browser workflows, and 4 production PWA workflows pass, plus TypeScript/Vite build. Tests cover actual stopped test servers, reopening, details/progress/order-independent library behavior, completion, export/restore offline, failed-update cleanup, explicit successful update with history preserved, unrelated cache isolation, uncached dynamic/non-GET requests, and a full persistent-profile browser restart while offline. All use disposable profiles/libraries. The launcher startup was exercised successfully. New offline files and this day's notes are local and uncommitted; the prior backup/restore checkpoint a432439 is already on GitHub.

Binge design requirement reconfirmed by the user: visible card dragging plus up/down arrows on the right edge, vertically centered. Both must save the same manual order. Drag support/final placement remain pending for later implementation and Claude's visual work.

## Offline/installable GitHub checkpoint — 2026-11-06

The user authorized committing/pushing the tested offline/installable work, and clarified that this authorization does not include implementing draggable cards now. This checkpoint includes the offline app shell, install manifest and placeholder icons, startup/update controls, production/development launcher separation, 4 production PWA tests, and updated instructions/design notes. Existing verification: 100 unit/database/validation tests, 13 browser workflows, 4 production offline/update workflows and build passed. Draggable cards and right-middle arrows remain planned. Commit and remote upload are verified in the associated chat and Git history.
