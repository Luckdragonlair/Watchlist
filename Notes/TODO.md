# Watchlist backlog

Updated: 2026-11-05

## Implemented in v0.1

- [x] Delete show in detail with confirmation; atomic metadata/history/preferences/source cleanup, reload protection, clean re-add, same-name safety, old-history migration and pending-import protection.

- [x] Preserve original planning files and master; record master SHA-256.
- [x] Normalize 301 installments / 208 titles, exclude all 5 Silo rows, flag Re S3/Re S4.
- [x] React/TypeScript/Vite app and independent IndexedDB records for metadata, progress, preferences.
- [x] TVmaze explicit candidate selection, import, atomic snapshot refresh, progress protection.
- [x] Episode check-off, automatic advance, undo, explicit already-watching catch-up.
- [x] Basic Weekly, Binge filtering and persistent arrow ordering, Watched history and show details.
- [x] Central Time dates, unknown availability handling, verified-season completion dialog.
- [x] Source catalog visible before matching; selected matches apply explicit watched-season history.
- [x] Unit/database and browser workflow tests; live TVmaze coverage sample.
- [x] Run instructions and JSON backup export.

## Silo held-out test: pending

- [x] Exclude Silo from initial import; retain it in the original.
- [x] Fix user-reported Silo Friday placement: fully released S3 backlog remains Binge; an unstarted future S4 premiere does not make it active Weekly. Automated regression coverage passes.
- [ ] Continue manual Silo run at the user's selected S3 E8, which supersedes the originally planned S2 E8. Backfill was reported working; Binge placement confirmation, check-off/undo and refresh acceptance remain pending. See manual run update in TEST_CASE_SILO.md.
- [ ] Finish the remaining checks in TEST_CASE_SILO.md and record ID/counts/actual results before marking PASS. The generic onboarding test is not the Silo acceptance test.
- [ ] Preserve the user's actual selected S3 E8 starting point. The older planned S2 E8 state and the original master's conflicting Silo rows must not overwrite current progress.

## Needs review

- [ ] Identify Re S3 and Re S4; acceptance: actual titles supplied, working copy corrected, original unchanged.
- [ ] Match remaining source titles through positive candidate selection. Ghosts has multiple exact matches; DAN DA DAN has a different provider spelling. Preserve season scopes and source history.
- [ ] Independently verify future schedules/renewal assertions before treating them as facts.
- [ ] Review source watched history per title: it reports seasons, not exact episode watch times. Stored timestamps record entry into this app, not historical viewing time.

## Follow-ups

- [ ] Later idea from user: add Search on TVmaze for spelling/alias mismatches, then accept a selected show URL/ID back in Watchlist with explicit confirmation. Do not implement during v0.1. Existing title search can already be edited for alternate spellings.

- [x] Validated JSON backup restore/transfer with preview, explicit replacement confirmation, cancellation, atomic rollback, exact round-trip tests, and cross-tab restore safety.
- [x] Installable PWA and offline reopen: production caching, manifest/icons, install guidance, controlled updates, offline tracking/details/order/backup/restore, and full-browser-restart verification with the server stopped. User OS installation remains manual.
- [ ] Smooth drag-and-drop plus Watch Now/Watch Soon, preserving manual Binge order.
- [ ] Completion recommendations from Binge with Skip/Pass/dismiss actions.
- [ ] Explicit specials, manual release corrections, richer season-level placement, unknown future seasons.
- [ ] Accessible modal focus management and Claude's final responsive design.
- [x] Connect D:\Watchlist to the existing Luckdragonlair/Watchlist Git history while preserving app files. Initial checkpoint 4fb09e3 is uploaded.
- [x] Commit and push the initial tested v0.1 checkpoint (4fb09e3).
- [x] Include the tested export/restore work in the user-authorized backup/restore GitHub checkpoint.
- [ ] Select a code license before public release; no deployment exists.

## Export feedback follow-up — 2026-11-05

- [x] Fix hidden Export backup confirmation; show nearby feedback and a reusable download link, timestamp filenames, and export one consistent database snapshot. The user's existing backup was found and checked without changing progress.
- [x] Include export feedback, top-right controls and validated restore in this checkpoint.

- [x] Move Export backup to the top-right controls; retain nearby feedback/re-download link and wrap the toolbar on small screens. Export workflow, desktop/mobile placement and build verified.

- [x] User-reported browser check of the new backup restore flow: seems to work fine (2026-11-05). Automated recovery tests already pass; no independent inspection of the user's restored record counts was performed.

## Manual completion follow-up — 2026-11-06

- [x] User-reported completion of The Handmaid's Tale: checking Episode 10 correctly marked it watched and placed it in Watched. Season and post-reload state were not independently verified.
- [ ] Keep next-watch recommendations after completion as a future feature; no recommendation behavior added in this follow-up.

- [ ] Binge card design requirement confirmed 2026-11-06: visible card dragging plus up/down reorder arrows on the right edge, vertically centered. Both must save the same manual order. Coordinate final styling with Claude.

## Offline/installable follow-up — 2026-11-06

- [x] Production app stays at 5174; development moves to isolated 5175. Normal launcher builds/serves the offline-capable app.
- [x] Cache only the static app shell/catalog; metadata stays in IndexedDB and TVmaze requests are not cached by the worker.
- [x] Verify explicit update acceptance, failed-update rollback to the working offline app, unrelated-cache preservation, full browser restart, and offline backup/restore.
- [ ] User check: refresh the normal app, wait for Available offline, and optionally install through Edge/Chrome. Export/restore when moving to another browser.
- [x] Include tested offline support and recorded draggable/right-middle-arrow requirements in the user-authorized offline/installable checkpoint. Card drag implementation remains future work.
## Cross-device target — 2026-11-06

- [ ] Prioritize easy Android-phone and PC use: one stable hosted HTTPS address, responsive/touch-friendly PWA and optional installation on each device. Local loopback access is not the final distribution method.
- [ ] Design secure shared-library/progress/order sync, including offline changes and conflicts, before implementation/deployment. Do not rely on manual backup transfer as the everyday workflow.
- [ ] Verify actual Android installation/use, touch controls, PC-to-phone progress changes, offline operation and reconnect behavior. Current desktop/mobile viewport tests do not establish real-device sync or phone access.

- [ ] Deliver one-click app-style launch on both Android and Windows, preferably with installed standalone PWAs; avoid requiring routine navigation in browser tabs. Verify on real devices.
- [ ] Synchronize library, watched flags and manual ordering automatically across the phone and PC, including reconnect/offline conflicts. Keep app-code updates separate from viewing-data sync.

- [ ] Firefox is the user's preferred browser. Verify Watchlist on Firefox Windows and Android, including taskbar/home-screen launch, offline reopening, updates, backup/restore and touch controls. Existing Edge-only automated results must not be labeled Firefox verification.
- [ ] Update app installation guidance and OFFLINE.md to include Firefox's version/platform-specific options; avoid requiring a browser switch. App-data sync must not depend on Firefox Sync.

## Free Firebase preparation — 2026-11-06 07:21 CST

- [x] User selected Spark and Google sign-in, free-only; registered genre-watchlist web app.
- [x] Separate hosted build excludes personal master; sign-in gate and UID-bound local storage prepared.
- [x] Pure sync protocol tests cover duplicates, conflicts, deletion lifecycle, account and restore generation boundaries. Not yet persistent or networked.
- [x] Live Google sign-in observed in the in-app browser and intended owner UID bound locally; owner-library opening after update confirmed by user report in the in-app browser.
- [x] Portable Java and 5 local rules tests for locked-write groundwork pass. Expanded write/schema rules must be tested before enabling cloud writes.
- [ ] Centralize remaining direct mutations, add transactional persistent outbox, implement Firestore adapter and conflict UI, then test two-device sync.
- [ ] Deploy private-data-safe hosted build and verify Android; no deployment performed yet.

## Hosted trial acceptance — 2026-11-06 08:03 CST

- [x] Publish hosted build with personal master excluded and verify billing remains disabled.
- [x] Verify live unsigned-in screen, manifest, private master exclusion and unsigned offline shell in an isolated browser.
- [ ] Verify hosted Google sign-in in actual Firefox on PC and Android.
- [ ] Install hosted trial on Android; verify opening with PC off and offline reopening.
- [ ] Verify signed-in offline library behavior and deliberate migration after synchronization is ready.
- [ ] Build persistent outbox, validated cloud adapter and conflict handling before enabling automatic sync.

- [x] Hosted sign-in stall: offline router bypasses Firebase helpers; user confirmed sign-in works after update. Browser/device-specific acceptance remains separate.

## Shared sync release — 2026-11-06 10:27 CST

- [x] Durable baseline/pending-upload queue, three-way merge and guarded acknowledgement/restart recovery.
- [x] Owner-only hashed chunk transport and complete atomic write/security validation; local emulator suites pass.
- [x] Sync/offline/error/conflict status and explicit backup/whole-library conflict choices.
- [x] Guard unsaved notes drafts against remote notes updates.
- [x] Publish sync build/rules/index exemption to genre-watchlist after verifying billing disabled.
- [ ] Transfer a fresh original-library backup to the hosted owner library and compare counts/next episodes/notes/order.
- [ ] Actual Firefox PC/Android two-way progress/undo/order/notes, offline reconnect, delete/re-add and restore acceptance.
- [ ] Actual signed-in offline reopening and hosted installation with PC switched off.
- [x] User-reported hosted launch on PC and Android, automatic phone sign-in and authenticated return after accepting app update (2026-11-06 10:32 CST).
