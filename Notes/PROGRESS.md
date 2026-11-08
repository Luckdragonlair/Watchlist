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

## Android and PC goal reaffirmed — 2026-11-06

The user emphasized easy Android-phone use alongside the PC. This is now explicitly a primary target in DECISIONS.md and TODO.md. The current PWA/offline work is a foundation, not completion of cross-device access: the local 127.0.0.1 address does not make the PC app available on the phone, and libraries remain browser/device-local. Plan stable hosted HTTPS access and secure progress/library/order synchronization, keeping offline support and touch-friendly interaction. Installation remains optional; automatic sync and deployment are not yet implemented or authorized by this reminder. No code or viewing data changed.

## Ordered development roadmap — 2026-11-06

Created Notes/ROADMAP.md at the user's request. It separates completed local tracking/data-protection/offline foundations from remaining Firefox verification, architecture decisions, hosted access, secure cross-device sync, Binge controls, completion/library behavior, Claude design and real-device release acceptance. It includes dependencies and done criteria, preserves the partial Silo status, flags movie scope as a decision, and identifies Firefox access plus hosting/sync design as the next concrete task. No code, viewing data, hosting or sync implementation changed. The roadmap and recent browser/device requirements are local documentation changes awaiting a future commit/push.

## Roadmap progress tracker — 2026-11-06 05:45 CST (America/Chicago)

Updated ROADMAP.md with status marks, initial remaining-effort estimates for every milestone, explicit dependencies, verified progress dates, and an append-only dated log. Earlier dates without times remain labeled accordingly. Initial remaining estimate is 12–26 focused sessions of roughly 1–2 active hours; calendar completion remains unscheduled. Preserved the prior roadmap under originals/. No code, user viewing state, deployment or new tests changed.


## Firefox preparation — 2026-11-06 06:53 CST

Confirmed installed Firefox 159.0.1 from executable version information and checked Mozilla Windows/Android web-app guides. Updated installation help to include Firefox and clarify phone access needs hosting. Actual Firefox installation/offline behavior has not been observed. Roadmap step 4 is underway; Android acceptance follows step 5 hosting. Proposed direction: hosted app plus private authenticated backend; provider unselected. Supabase pricing reviewed: free projects currently pause after one week of inactivity; Pro starts at USD25/month. No accounts, deployment or personal data migration performed.

Verification for the Firefox help change: TypeScript and production build passed. This was a text-only help change; device acceptance remains pending.

## Firefox user check — 2026-11-06 06:58 CST

User reported Watchlist loaded successfully in Firefox and taskbar web-app setup worked. Recorded these two checks as passed by user report in OFFLINE.md and ROADMAP.md. Available offline status, reopening from the taskbar with the local launcher stopped, and actual Android acceptance remain unverified. Hosting and automatic synchronization are not implemented. Documentation only; no viewing state changed.


## Firefox internet-disconnected reopening — 2026-11-06 07:00 CST

User reported the instructed flow worked: wait for Available offline, close Watchlist, disconnect PC internet, and reopen from the taskbar to view saved shows. Recorded as passed by user report. The local launcher was not explicitly stopped, so this does not establish Firefox reopening without the local server. Edge production server-stopped automated coverage remains separate. Android installation, hosted access and cross-device sync remain open. Documentation only; no personal viewing state changed.


## Hosting and sync proposal — 2026-11-06 07:02 CST

Prepared HOSTING_PLAN.md after reviewing official Firebase pricing, quotas and security-rule guidance. Proposed ordinary Firebase Hosting, Authentication and Firestore on Spark with Google sign-in, existing offline IndexedDB retained, owner-only access, private seed removal before deployment, and explicit migration/conflict/restore design. Proposal only; no account, billing, deployment or viewing-state change. Provider and sign-in preference await user selection.


## Firebase groundwork verification — 2026-11-06 07:23 CST

Saved the reviewed groundwork into D:\Watchlist after preserving prior changed files under originals/before-cloud-foundation-*. From D: TypeScript, 139 unit/database/validation/protocol tests, normal production build, hosted build/privacy guard and 1 isolated hosted sign-in-screen browser test passed. Matching source in staging also passed all 13 existing browser workflows and 4 production offline/update workflows; no personal browser library was used. Hosted smoke test blocks external requests and confirms no personal catalog fetch or Watchlist database before sign-in; it is not a real Google sign-in test. The 27 pure protocol tests do not establish persistent/live sync. Master SHA-256 remains 6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be. Configured project genre-watchlist; credentials are public web configuration in ignored .env.hosted.local. No commit/push, deployment, cloud data migration or billing change performed. Java shim is broken, so Firestore emulator/rules testing remains open and all cloud writes stay disabled. Local setup preview uses localhost:5182; normal library remains at 127.0.0.1:5174.

## Google owner sign-in confirmed — 2026-11-06 07:28 CST

Observed the signed-in account and exact Firebase UID in the local setup page through browser accessibility text. Bound that UID in ignored hosted configuration and local Firestore rule source. All cloud writes remain denied; no rules deployed or data uploaded. Rebuilt hosted app; TypeScript, hosted asset privacy guard and isolated unsigned-in hosted smoke test passed. Live Google sign-in was observed in the in-app browser, not Firefox or Android. Owner-library opening after accepting this update still needs confirmation. Existing local library and original master remain untouched. No paid plan, deployment, migration, commit or push performed.

## Owner-library opening confirmed — 2026-11-06 07:30 CST

User reported the updated owner-bound setup worked after the instructed refresh/update. Recorded owner-library opening as passed by user report in the in-app browser. This confirms the local sign-in/access checkpoint, not deployment or cross-device synchronization. No viewing data was imported or changed by the assistant. Cloud writes remain disabled. Next: create the free Firestore Standard database in production/locked mode and complete local security-rule/sync tests before publishing data.

## Firestore database created — 2026-11-06 07:36 CST

User screenshot shows the genre-watchlist default Cloud Firestore database created and empty, with Spark No-cost ($0/month) visible. No collection or personal library data shown. The screenshot does not show edition, location or deployed Rules content; those are not independently verified by this check. Next check: Rules tab should retain production deny-all access while local sync/security testing proceeds. No cloud data or rule changes made by the assistant.

## Local rules tests and Firebase CLI access — 2026-11-06 07:56 CST

User confirmed live production Rules deny all reads/writes. Prepared a portable Temurin Java 21.0.13 runtime in ignored .tools, verified archive SHA-256 against official Adoptium metadata; system Java was not modified. Five local Firestore emulator tests passed in staging: configured owner own-path reads allowed; anonymous/other-account reads denied; cross-owner paths denied; even owner create/update/delete denied; configuration and unmatched paths denied. Tests hardcode demo-watchlist-rules, load actual rules source and refuse non-loopback emulator endpoints. The actual genre-watchlist database was not used by these tests. Saved reproducible runner/test files into D:\Watchlist; dependency installation is being completed there. Shared-data rules/transport are not yet implemented or enabled.

User completed CLI login automatically through localhost callback, with no manual code required. Read-only CLI verification succeeded for genre-watchlist default database: native Firestore, us-central1, point-in-time recovery disabled. No live rule/deployment/library-data change or billing change performed. New administrative access is authorized for this project only.

Final saved-checkpoint verification — 2026-11-06 07:57 CST: dependency installation completed in D:\Watchlist; TypeScript and all five local Firestore rule tests passed from D:\Watchlist. Local emulator shut down cleanly. No live database writes, deployments or billing changes. Sign-in helper now uses the project-local CLI and recognizes automatic login completion without requiring a manual code.

## Hosted trial published — 2026-11-06 08:03 CST

User requested next development step and authorized direct Firebase management for genre-watchlist. Read-only project billing check returned billingEnabled:false. TypeScript, 12 focused configuration/privacy tests, hosted build/privacy guard and 1 unsigned hosted browser test passed. Published only Firebase Hosting using explicit project genre-watchlist; deployed 12 static files from dist-hosted. No Firestore rules, library data or billing settings were changed.

Live isolated Edge check passed at https://genre-watchlist.firebaseapp.com/: sign-in screen visible, manifest available, private master path returns app HTML rather than catalog JSON, service worker excludes master, no Watchlist database opens before sign-in, unsigned-in shell reopens offline and zero page errors. Worker version 435792cd9fd46bca2f60349df47e15bfc4bfd1909530246bee4cc5b6eec3a732. Hosting also supplies https://genre-watchlist.web.app/; use firebaseapp.com consistently for initial tests because it matches the configured auth domain. Real hosted owner sign-in, actual Android installation/offline checks and migration remain open. Existing local libraries untouched. Automatic sync is not connected. No Git commit/push performed.

## Hosted Google sign-in navigation fix — 2026-11-06 08:20 CST

User reported Google sign-in flashes without opening login in the hosted embedded preview. Root cause was not independently established; the observed page had no explanatory error. Changed primary firebaseapp.com hosting to signInWithRedirect in the same window, handled getRedirectResult on return, retained popup for localhost/nonmatching origins, added offline/busy feedback and specific safe messages for common auth failures. Google documents same firebaseapp.com hosting/auth domain avoids redirect third-party storage issues: https://firebase.google.com/docs/auth/web/redirect-best-practices . No credential, library or cloud-rule changes.

Verified TypeScript, 20 focused auth/config tests, hosted build/privacy guard and unsigned hosted browser smoke test pass. Published hosting only to genre-watchlist. Live isolated browser click reached same-window Firebase auth handler with google.com and signInViaRedirect; the handler was intercepted before credential entry, so this verifies navigation rather than a completed Google login. User must accept the app update and retry; actual hosted Firefox/Android and embedded-browser completion remain unverified. No billing change or watchlist migration.

## Firebase helper routing root cause fixed — 2026-11-06 08:29 CST

User reported Checking sign-in hanging after the redirect change. Reproduced on live hosting in an isolated browser: after offline caching was active, navigating /__/auth/iframe returned the Watchlist index from the service worker. The SPA navigation fallback incorrectly intercepted Firebase Hosting reserved helper pages. This also explains why first-load/worker-blocked navigation checks missed the failure; the prior popup diagnosis was incomplete.

Excluded all /__/ paths from service-worker interception, allowing Firebase iframe/redirect endpoints to reach the network. Added real iframe and top-level redirect regression coverage with the worker already controlling the page; new test failed against the old production build and passes after rebuilding. Added bounded sign-in checking feedback after 10 seconds without bypassing authentication. TypeScript, normal/hosted builds, privacy guard, all 5 production PWA tests and hosted unsigned smoke test pass. Published hosting only. Live warm-cache check passes: reload reaches sign-in UI, actual Firebase iframe response is not served by service worker and is not app HTML, and button reaches same-window sign-in handler with cache active. Google credentials were not entered in automated checks; actual user completion remains to confirm. Existing libraries, live Firestore rules and billing unchanged.

## Hosted sign-in recovery confirmed — 2026-11-06 08:35 CST

User reported the hosted sign-in worked after the Firebase helper routing fix and instructed app update/retry. Record the reported stuck sign-in issue as resolved by user acceptance. Browser/device was not specified in this confirmation; do not infer full Firefox/Android installation or offline acceptance. Cloud synchronization and existing-library migration are still pending. No additional library, deployment, rule or billing changes made for this confirmation.

## Synchronization integration in progress — 2026-11-06 10:13 CST

Resumed after usage interruption. Sync implementation remains in writable staging pending final review/copy/deployment. State-based three-way merge, owner-only chunked Firestore transport and status/conflict UI are implemented. Local SDK emulator verification: 13 security-rule tests and 5 transport/two-database integration tests pass, including offline reconnect, deletion safety, restore generations, UTF-8 chunking, stale revision and corrupt/oversized payload refusal. Review found and is closing upload/undo acknowledgement and crash recovery boundaries before release. No new live rules or sync build deployed yet; original local library unchanged. Added Notes/CLAUDE_DESIGN_HANDOFF.md so visual design can proceed independently.

## Automatic synchronization deployed — 2026-11-06 10:27 CST

Completed and published owner-only shared-library synchronization. Saved state baseline and pending upload intent persist in IndexedDB; three-way merge covers progress/undo, notes, Binge order, metadata/source records, deletion/re-add lifecycles and full-restore generations. Atomic acknowledgement rebasing preserves edits made during upload; persisted intent recovers a lost reply/restart, and ambiguous newer server state pauses rather than discarding data. Explicit whole-library conflict choices include backup export and replacement confirmation. Remote notes refresh clean fields and preserve unsaved drafts with guarded overwrite.

Verified from D:\Watchlist: TypeScript; 195 unit/database/merge/recovery tests; 14 regular browser tests; 5 production offline/update tests; 1 unsigned hosted privacy test; 13 security-rule tests; 5 real SDK/independent-database integration tests; normal and hosted builds/privacy guard all PASS. Integration covers offline merge/reconnect, deletion conflict without resurrection, restore epochs, multi-chunk UTF-8 payloads, hash corruption, stale CAS and size rejection. Prior files archived under originals/before-sync-*. Original master hash remains 6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be.

Before deployment, live read-only billing check returned billingEnabled:false and the sync manifest did not exist. Deployed firestore:rules, firestore:indexes and hosting explicitly to genre-watchlist. Snapshot data indexing is exempted; no paid products or billing changes. Live isolated browser check confirms sync build marker, unsigned sign-in screen, cached reload, reserved auth endpoint bypass, private master exclusion and zero page errors. A fresh in-app browser view was unsigned, so actual signed-in live two-device sync still needs user acceptance; no personal records were injected for testing. Original local viewing library was not migrated or modified. A fresh backup transfer and actual Firefox/Android checks remain. No Git commit/push performed.

Added SYNC.md migration/recovery instructions and Notes/CLAUDE_DESIGN_HANDOFF.md for independent visual work. Code deployment is complete; real-device and personal-library acceptance remain open.

## PC and Android sign-in/update confirmed — 2026-11-06 10:32 CST

User reported the hosted app worked on both devices, the phone signed in automatically, and accepting Update and reload returned to the signed-in app automatically. Recorded actual phone/PC launch, session persistence and update re-entry as passed by user report. The report does not independently establish backup migration, matching library counts or two-way data edits; those remain separate acceptance checks. No viewing state or deployment changed for this confirmation.

## Nightfall foundation - 2026-11-07 08:20 CST

First approved Nightfall presentation milestone completed. See [NIGHTFALL_FOUNDATION.md](NIGHTFALL_FOUNDATION.md) for delivered scope, exact verification and remaining V2 work. 195 unit tests, 15 browser tests (14 existing plus one responsive), 6 PWA tests (five existing plus offline fonts), hosted unsigned privacy check, TypeScript and both builds/privacy guard passed. Desktop/phone fixture screenshots inspected. No personal library or sync behavior changed.


## Published - 2026-11-07 08:23 CST

Published only Firebase Hosting for genre-watchlist. Live isolated signed-out Edge check passed: Nightfall colors, three locally loaded font families, cached font allowlist, private-master exclusion, no Watchlist database before sign-in, phone width without overflow and zero page errors. Existing signed-in devices need to accept Update and reload; signed-in visual acceptance is still requested from the owner. No database rules, billing or viewing records were changed by this release.

## Weekly backlog regression fixed - 2026-11-07 09:36 CST

User screenshot: Dexter: Resurrection S2 had released episodes and future Friday dates, yet an unwatched S1 kept it in Binge. User's manual S2 E2 onboarding worked around the bug. Removed weeklyRelease's oldest-unwatched-season restriction; release placement now considers any actually started season with a future regular episode. No direct library or metadata changes. Verified TypeScript, all 197 unit tests, all 16 browser workflows, normal/hosted builds and privacy guard, plus the PWA update-preserves-library workflow. Fixed-date regression verifies Friday placement and unchanged older watched flags; existing future-unstarted-season regressions still pass. Paramount's episode page confirms S2 has started; provider episode labels differ between cached views, so no episode names or dates were rewritten: https://www.paramountpressexpress.com/showtime/shows/dexter-resurrection/episodes .

Published Hosting-only to genre-watchlist. Live index and service worker were read back and match the tested hosted build. No database rules, billing settings or personal records changed. Existing devices need to accept Update and reload.

## Post-import setup verified - 2026-11-07 10:05 CST

Implemented the user-requested setup step for Add Show and source matching, then return to the originating list/import queue. Optional current episode, prefilled notes, Save and continue / Skip; no episode guessing. Source seasons are linked once per series as before. Atomic guarded save leaves current/later, future, special and unknown-release history intact. 202 unit tests, 22 browser workflows, 6 PWA workflows, hosted unsigned check, TypeScript and both builds/privacy guard PASS. New browser checks cover all three library origins, filtered Import queue, explicit catch-up plus notes persistence, notes-only and no-episode shows, Skip/Escape, modal/return focus and 320px width. Phone fixture screenshot inspected. No actual personal records or bulk matches changed. No helper agents used. Publish pending at this checkpoint.

Setup release published to genre-watchlist (Hosting only). Read-back index and service worker match the tested build. No rules, billing, personal viewing records or bulk matches changed. Owner should accept Update and reload and verify the next successful show match/import offers setup.

## Reviewed matching and folder export - 2026-11-07 10:52 CST

138 approved clear matches applied at revision 20, then 3 owner-selected adaptations at revision 21. Server readback and private current export show 152 series / 4,023 episodes. Existing personal records preserved; 56 groups held. Five focused maintenance tests and TypeScript passed. User approved read-only current-folder watcher; it is running for this Windows session, without automatic startup. See LIBRARY_EXPORT.md and the private Library/Remaining Matching Choices.md. No app/rules/billing deployment occurred.

## Caught up and v0.2.0 - 2026-11-07 19:45 CST

Added Caught up to setup and show details. Released regular episodes are marked watched without changing existing timestamps, future/special/unknown release records or tracking. Setup notes/progress remain an atomic guarded save. New browser tests cover both entry points, persistence, untouched future progress and a later release entering the queue. Unit regressions cover date-only Central boundaries, notes atomicity and existing-record preservation. Visible version now derives from package.json (0.2.0); it previously stayed v0.1 despite separate Git and worker versions advancing. Database names, schema and backup format unchanged.

PASS: TypeScript, 209 unit tests, 22 existing browser workflows and 2 new caught-up workflows (24 total), 6 PWA workflows, hosted unsigned check, both builds and hosted privacy guard. Initial new browser selectors used visible text instead of existing accessible names; corrected the tests and both new workflows passed. Disposable libraries only; no actual watched history, source matching, account rules or billing changed. Published Hosting-only to genre-watchlist. Live index, service worker and app chunk match the tested build. Original master SHA-256 remains 6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be. Existing devices should accept Update and reload.

## Automatic returning-season discovery (v0.3.0) - 2026-11-08

User requested periodic discovery rather than requiring knowledge of a new season. Added per-show 24-hour due checks, launch/return/reconnect/minute triggers while visible and online, paused during setup/manual work/restore and hosted initial sync or unresolved conflicts. Device-local lease, sequential requests with two-second spacing, 15-minute global failure backoff and one-hour per-show retry. Existing shared refreshed timestamps reduce duplicate device checks; there is no cross-device global lease or closed-app server scheduler. TVmaze does not separately establish definitive cancellation, so Ended and caught-up/Watched shows stay included. Cancellation overrides remain deferred rather than inferring facts.

Validated metadata updates retain notes/order/progress/source history and use revision/lifecycle/metadata/lease/conflict guards. Rejected provider identifier collisions and malformed bundles cannot overwrite saved data. No bulk matching, actual personal-history edits, schema or backup-version changes. Original master remains untouched. Minor version bumped to 0.3.0.

PASS: TypeScript, 221 unit tests; 24 existing browser workflows plus both new returning-season scenarios (26 total); 6 PWA workflows; hosted unsigned privacy check; local and hosted builds/privacy guard. New browser scenarios prove an ended caught-up show automatically gains a new season and returns to the watch queue on reopen or while remaining open, retains notes and prior watched episodes, and avoids same-day repeated fetching. Final hosted sign-in privacy and offline update-preserves-library checks also passed after the pause/resume wiring. Published Hosting-only to genre-watchlist. Live index, service worker, App and sync-status chunks match the tested build. Original master SHA-256 unchanged (6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be). No rules, billing or account changes. Accept Update and reload on existing devices; actual PC/Android daily-check acceptance remains user verification.

## Saved and alphabetized title filing (v0.4.0) - 2026-11-08

Move leading standalone A/The to trailing , A / , The in show-card/unmatched-group display and alphabetical sorting. Owner then explicitly requested saving imported names in this form: saveBundle applies idempotent filing on imports/source matches and manual/automatic metadata refresh. Existing shows display in the filed form immediately and save it on next refresh; no bulk migration. Preserve provider IDs/URLs, original master/source text/title fields, notes/history and manual sort preferences. Library/source filtering accepts original and filed title forms. An and words such as Theater remain unchanged. Next planned feature remains V2 Binge organization using the shared titles.ts helper.

PASS: TypeScript, 221 unit tests; focused import/sorting/search/export/refresh browser regression and responsive Nightfall browser regression; normal/hosted builds, hosted asset privacy guard, unsigned hosted check and PWA update-preserves-library check. The browser regression verifies saved exported names and retained order values, original-provider refresh idempotence and both search forms. Original master and private library were not edited for testing. Published Hosting-only; live index, service worker and App chunk match the tested build. Original master SHA-256 unchanged. No rules or billing changes.

## Unknown episode-date sync recovery (v0.4.1) - 2026-11-08

Diagnosed the owner's exported snapshot without modifying its original. A future Kaiju No. 8 episode (3379036, S3 E1) has airdate='' and airstamp=null in both the export and live TVmaze metadata. The generic strict sync validator misclassified this unknown date as a whole-library conflict. Normalized the exact empty airdate to null for provider imports/backup validation and added an atomic legacy stored-date repair before sync's first snapshot. No date inference or broad cleanup. Malformed nonblank dates remain rejected. Validation failures now publish invalid state with export/retry, not full-library choice buttons; automatic metadata checks pause accordingly.

Preserved private before.json under ignored originals/date-repair-2026-11-08/. On the actual 178-show / 4,568-episode export, validation succeeds with exactly one blank-to-null correction and every other data value identical (comparison ignores JSON object-key ordering). Original exported file remains untouched. Unit regression proves a legacy blank-date library merges independent pending notes and watched edits with another device, without either full-library replacement. Provider/browser regression keeps announced unknown episodes unwatched and exports null.

PASS: TypeScript, 225 unit tests, focused provider-date browser check, 13 rules/access tests and 5 Firestore SDK integration tests using disposable local emulators. Final normal/hosted builds/privacy guard, hosted unsigned check and PWA update-preserves-library passed after the invalid-state warning style was included. Published Hosting-only to genre-watchlist. Live index, worker, App and sync-status chunks match the tested release. Original master and exported-backup hashes are unchanged. No rules/billing changes. No real history, account, billing, rules or cloud library edits by the agent; actual browser recovery requires owner to accept Update and reload/reopen.

## V2 Binge organization and unmatched Match queue (v0.5.0) - 2026-11-08 04:20 CST

Built Ready with Watching now/Watch soon (shared saved arrow order) and alphabetical Everything else; Upcoming by confirmed date including date-only metadata, alphabetical TBA, and reversible Not for me. Hidden shows keep all data and remain in viewing history. Legacy preferences map to Watch soon without migration/rank loss; new imports explicitly choose Everything else. Stored section/order actions guard revision/lifecycle, and conflicting device changes retain existing conflict review. Dragging/A-Z are not implemented.

Import now handles working files/counts. Match beside it (also on phone) shows only pending/review rows, keeps its filter across post-match setup, and removes matched/excluded entries from the queue while preserving original source records. No bulk/ambiguous mappings or source/history rewrites. Existing tests were updated to navigate explicitly to Match/Upcoming as appropriate.

Format-2 exports/shared snapshots carry the validated optional section property and fence out older app validators that would otherwise strip it. Format-1 imports remain supported; schema v3/database names/cloud manifest and rules unchanged. Update PC/phone to v0.5.0. The read-only folder summary uses the same pure section and filed-title helpers, refreshing on renderer-version change as well as cloud revision.

PASS: TypeScript, 232 unit tests, all 30 browser workflows, 6 PWA workflows, hosted unsigned check, 13 rules/access tests, 5 real SDK integration tests against disposable local emulators, and both builds/privacy guard. Inspected the fictional phone sections screenshot; automated 320px/412px and arrow placement checks pass. Export/restore/sync tests preserve notes/progress/source text and section choices, with stale-action and version validation coverage. Read-only helper refresh validated server revision 59 (179 shows), wrote current JSON/Markdown with renderer version 2, and started the updated hidden session watcher (no reboot startup installed). Published Hosting-only to genre-watchlist; live index, worker and App chunk match the tested build. Original master hash unchanged; no rules or billing changes. Ready for the Git checkpoint.

User reported the prior v0.4.1 repair restored Up to date; phone was not separately inspected. Updated the roadmap and easy-to-find notes index, retaining dated history. User plans Claude-designed splash/title and optional PC banner assets; those remain unimplemented design work and are recorded in TODO.

2026-11-08 design follow-up: owner proposes a movie-style spotlight sweeping across a wall/stage/screen to reveal Watchlist. Claude is preparing the splash and possible PC banner assets. This is a proposed visual concept, not built or a reason to delay library access; use a brief nonblocking reveal and a static reduced-motion state. Final assets still need review.

## Phone content-first controls (v0.5.1) - 2026-11-08

Inspected the owner's local phone recording read-only; extracted private preview frames remain outside tracked files. The first screen was mostly account/sync, backup, import/match, timezone and installation controls. Replaced this phone stack with a compact brand/More header and one healthy cloud row. More retains Import/Match, backup/restore, install/offline options and timezone; primary navigation stays fixed at bottom and search stays visible. Update/offline error and sync-problem actions are outside More. Hide empty Ready groups, keep filters on one row and reduce heading/notice whitespace. Desktop utility access is preserved; all data/backup/sync behavior remains unchanged.

New disposable browser workflow proves first episode actions above bottom navigation on 320/412px screens with 640px height, menu keyboard/Escape and focus behavior, export and safe restore cancellation. Initial test failures exposed native details toggle timing (fixed by explicitly closing the native element) and an invalid fixture timestamp (corrected). A separate automatic-metadata test raced its own 24-hour fake-clock jump against a startup lease; synchronized that test with the completed fresh-data sweep, without changing scheduler behavior. Targeted repeated checks and final offline/build results are recorded before handoff. New fictional screenshot: artifacts/compact-phone-header.png. Owner video/private frames are not included.

PASS: TypeScript, 232 unit tests, 31 unique browser workflows (30 passed in the full run; the corrected clock-synchronization pair passed three targeted repetitions), seven PWA workflows including phone offline/update alerts with More closed, hosted unsigned privacy check and both normal/hosted builds/privacy guard. The phone geometry check passed with an extra 44px budget for the signed-in account row. Published Hosting-only; live index, worker, App and CloudBootstrap match the tested v0.5.1 build. Original master hash unchanged; no rules/billing changes. No actual personal library was modified for testing.


## Original splash, gold banner and Weekly launch (v0.6.0) - 2026-11-08

The owner approved Claude's original dark Brick alley (04) and Gold banner (07), with the original white flash and approximately five-second sweep/flash/fly-up sequence on each page launch. Shorter timing, softened flash and earlier logo flight were rejected previews and are not used. This supersedes the earlier proposed brief/nonblocking reveal: startup data/auth loading proceeds underneath, but the decorative overlay remains for the approved sequence. Navigation inside the app does not replay it. No sound or skip control. Reduced motion uses the original static/fade path (about 1.6 seconds); forced colours bypasses the scene. Independent JavaScript/CSS failure cleanup prevents a stranded overlay. Limelight, the brick image and all runtime files are local, hosted-allowlisted and cached offline. The manifest/theme background is #05070d.

The banner replaces the duplicate navigation wordmark; the version remains visible. Phone More/bottom navigation stay compact. Account and healthy sync status occupy the banner status area; expanded account, errors/invalid data/conflicts get a full-width row, preserving actions. No library data, matching, schema, backup format or sync rules change. Source files are preserved unchanged in design/claude-splash-banner with selected source SHA-256 hashes.

Weekly is the default on a fresh launch/reload. Weekday sections start with today in America/Chicago, then cycle forward through the week, skipping empty sections. Existing placement and per-day show order are unchanged. The clock updates every minute and immediately on focus/visible return; this is not a closed-app scheduler.

Checkpoint verification/publication in progress; final results will be recorded below.

### v0.6.0 verified checkpoint - 2026-11-08

PASS: TypeScript, 234 unit tests, 39 browser workflows (38 full-suite plus the added banner-status check), eight PWA workflows (seven full-suite plus the updated ninth-font check), hosted signed-out privacy check, normal/hosted builds and public-asset privacy guard. Inspected fictional portrait/landscape and populated phone/desktop screenshots. Startup checks cover original 4.45s/600ms flight, launch-only replay, reduced motion, forced colours, runtime failure, responsive widths, and offline fonts/brick/runtime. Weekly checks cover midnight rotation, missing-day skipping and return-to-visible updates. Initial extraction and legacy navigation/font assertions were corrected; passing reruns are the recorded evidence. No personal library was used. Original master SHA-256 remains 6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be. Published Hosting-only; live index, worker, entry scripts and splash assets match the tested build.

## Three owner-requested removals - 2026-11-08

Removed exactly Re S3, Re S4 and The Return of the Shadow S2 from the live unmatched source queue (shared revision 79), verified server readback and refreshed Library/Watchlist Current.json/.md. All matched shows, seasons, episodes, viewing timestamps, notes, preferences, source metadata, lifecycle and epoch values were preserved. Current curated master Page and readable Current.md already contain none of these exact placeholders; no similarly named Re:ZERO or Shadow title was removed. Historical originals, raw imported source text and existing backups remain unchanged. Active starting catalog is now 298 rows / 206 titles; an exact SHA/row-ID/raw-title removal ledger prevents the normalization script reintroducing them. Original normalization audit remains historical. No app schema, sync rules, billing or hosted assets changed.
PASS: two focused master tests and real-catalog browser/export workflow; live removal readback at revision 79 verified all unrelated records unchanged. No hosted deployment needed: the personal seed is excluded from hosted assets.


## Card dragging and active Binge order (v0.7.0) - 2026-11-08 08:58 America/Chicago

Watching now and Watch soon have visible Drag handles for mouse/touch. Touch scrolling elsewhere on a card stays normal. Drag within the same section; started shows stay above untouched shows. Keyboard: Space/Enter picks up, Up/Down or Home/End chooses a position, Space/Enter saves, Escape cancels. Arrow buttons use the same atomic saved-order path and remain available. Long queues auto-scroll while dragging near the viewport edges. Filtered moves retain hidden cards; cancellation, navigation, resize and changed-state checks discard the preview. Drops are guarded against restore, deletion/re-add, activity, section, order and synchronization changes. Personal notes/history/metadata are not replaced by reordering.

Ready shows with recorded regular-episode progress automatically appear first in Watching now, newest recorded watch activity first. This includes onboarding/source watched records, whose timestamps reflect recording/import time rather than independent historical viewing dates. Unchecking the latest episode removes that activity; no new timestamp is invented. Actively releasing Weekly shows, upcoming-only shows and Not for me keep their placement rules. Dragging or arrows saves a manual override for the started group until Recent is chosen. Untouched manually selected Watching now shows stay below started shows and keep their own manual order. Alphabetical groups remain alphabetical.

A small optional preference flag preserves the started group's manual override. New backups/shared snapshots use format 3; formats 1 and 2 remain readable. Update Watchlist on both PC and phone. Older clients reject the new format rather than silently stripping the preference. Database names/schema v3, cloud manifest/rules, originals and personal library generation are unchanged. The read-only folder renderer shares grouping/activity rules and uses renderer version 3; restart its session watcher after this update.

User priorities: family access and social recommendations are deferred until the core app is finished. Movie support is required future work; provider, tracking/import behavior and release availability need design before implementation. API credits have no assigned feature; discuss their use later and do not spend them as part of this milestone. No family accounts or movie provider is enabled by this change.

Superseded by the verified release checkpoint below.

### v0.7.0 verification checkpoint - 2026-11-08 09:05 America/Chicago

PASS: TypeScript; 244 unit tests; 44 browser workflows (including actual mouse/touch input, keyboard focus/cancel, filtered moves, long-queue auto-scroll and activity/manual order/undo); nine PWA workflows including offline reorder/export/reopen; hosted signed-out privacy; 13 local access/rules tests and six Firebase SDK integration tests including format-3 manual order/reset across two disposable devices; normal/hosted builds and public-asset privacy guard. Fictional phone/desktop layouts inspected. Initial focus timing and legacy/new test-fixture assertions were corrected; final reruns passed. Real Android Firefox/TalkBack and desktop screen-reader acceptance remain separate. Published Hosting-only to genre-watchlist; live index, service worker and all app JS/CSS match the tested build. Restarted the authorized read-only folder watcher with renderer/validator 3; refreshed shared revision 79 (196 shows). No rules, billing, personal history or original master changes. Actual Android Firefox/TalkBack dragging acceptance remains. No live personal library edits were used to test the feature.
