# Primary genre application checkpoint

- [x] Owner submitted all 181 choices; initial identity/genre check and read-only live preview passed.
- [x] v0.9.0 primary preference/format-4 preservation verified and published; all 181 choices applied at revision 161; folder export/watcher renderer 4 current.
- [ ] Primary genre choice during matching/setup and existing-show editor remain future work.

# Primary genre review checkpoint

- [x] Private radio review page for 181 multi-genre shows; local autosave and focused verification. See GENRE_REVIEW.md.
- [x] Owner completed selections; safe primary-genre preferences and guarded application delivered v0.9.0.
- [ ] Add primary-genre choice during match/setup later; preserve all genres for filtering.

# Latest card layout checkpoint

- [x] v0.8.1 compact cards: six focused layout/interaction workflows, TypeScript and both builds passed; published Hosting-only; live index, offline worker and all app JS/CSS matched the tested build. Real Firefox/Android acceptance remains.

# Watchlist backlog

For the current consolidated order, prerequisites, difficulty and remaining estimates, use [FEATURE_PLAN.md](FEATURE_PLAN.md). The dated checklists below retain history and can contain superseded items.

Updated: 2026-11-08

## Implemented in v0.2.0

- [x] Caught up in setup and details: all aired regular episodes watched, future tracking retained, old timestamps protected; header uses the package release version.

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

- [x] Superseded 2026-11-08: owner removed Re S3, Re S4 and The Return of the Shadow S2 from active lists; no identification needed. Preserve historical originals.
- [ ] Match remaining source titles through positive candidate selection. Ghosts has multiple exact matches; DAN DA DAN has a different provider spelling. Preserve season scopes and source history.
- [ ] Independently verify future schedules/renewal assertions before treating them as facts.
- [ ] Review source watched history per title: it reports seasons, not exact episode watch times. Stored timestamps record entry into this app, not historical viewing time.

## Follow-ups

- [ ] Later idea from user: add Search on TVmaze for spelling/alias mismatches, then accept a selected show URL/ID back in Watchlist with explicit confirmation. Do not implement during v0.1. Existing title search can already be edited for alternate spellings.

- [x] Validated JSON backup restore/transfer with preview, explicit replacement confirmation, cancellation, atomic rollback, exact round-trip tests, and cross-tab restore safety.
- [x] Installable PWA and offline reopen: production caching, manifest/icons, install guidance, controlled updates, offline tracking/details/order/backup/restore, and full-browser-restart verification with the server stopped. User OS installation remains manual.
- [x] Implemented v0.7.0: PC/touch/keyboard dragging in ordered Binge groups, sharing the saved order with arrows.
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

- [x] Implemented v0.7.0. Binge card design requirement confirmed 2026-11-06: visible card dragging plus up/down reorder arrows on the right edge, vertically centered. Both must save the same manual order. Coordinate final styling with Claude.

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

## Nightfall foundation - 2026-11-07 08:20 CST

- [x] Preserve approved references, apply local/offline typography and theme, responsive navigation/cards, focus/reduced-motion handling and centered right-edge arrows.
- [x] Verify existing browser/offline behavior and new narrow-layout/font checks.
- [x] Implement V2 Binge sections with compatible persisted preferences before drag-and-drop (2026-11-08; v0.5.0).
- [ ] Implement A-Z slider, final dialog/status hierarchy and icon assets; verify real zoom/text sizes, Firefox/Android and assistive technologies.

Core real-device notes sync acceptance passed by user report; see SYNC_ACCEPTANCE_2026-11-07.md. Historical pending-sync items above are superseded only to that recorded extent.

## Weekly placement regression - 2026-11-07 09:36 CST

- [x] Active later seasons enter Weekly even when older seasons are unwatched.
- [x] Preserve future-premiere backlog protection and unchanged next-to-watch/history, verified in unit and browser regressions.
- [x] User reports Nightfall looks good; full palette/stronger accents remain part of visual refinement.

## Post-import setup - 2026-11-07 10:05 CST

- [x] Offer optional current episode and personal notes after every successful show match/import.
- [x] Preserve return view/import filter, prefill notes, support Skip/Escape and empty episode lists.
- [x] Verify atomic notes/progress saves and stale notes/restore/deletion safeguards.
- [ ] Owner visual acceptance on actual PC/phone after updating.
- [ ] Bulk matching assistance only when the owner explicitly asks to start; do not begin during genre spot checks.

## Matching/export checkpoint - 2026-11-07 10:52 CST

- [x] Apply and verify 138 approved clear matches plus 3 owner-selected adaptations.
- [x] Create private current JSON/Markdown app exports and start the approved read-only Windows-session watcher.
- [ ] Review the remaining 56 groups before further mappings; proposed versions and missing-season policy are in Library/Remaining Matching Choices.md.
- [ ] Automatic Windows-login startup remains optional and uninstalled.
- [ ] Full in-app resumable bulk matching, stronger genre palette and V2 Binge/dragging remain separate work.

## Automatic episode checks - 2026-11-08

- [x] Daily due checks on launch, reconnect/return and while open; include caught-up shows and retain manual refresh.
- [x] Validate metadata, space requests, persist retry backoff and lease same-browser workers; preserve viewing records and reject stale results.
- [ ] Owner acceptance on PC/Android after updating to v0.3.0.
- [ ] Confirmed-cancellation override/source remains deferred; TVmaze Ended alone never stops checking.
- [ ] Closed-app server checks/notifications remain deferred; current checks resume when the app reopens.

## Filed title names - 2026-11-08

- [x] Move leading A/The to trailing comma suffixes in saved imports/refreshes and alphabetical display/sorting; accept both search forms.
- [x] Preserve source text, provider identity, notes/history and manual ordering; verify saved backup names and refresh idempotence.
- [ ] Reuse titles.ts in the forthcoming V2 alphabetical sections and A-Z index.

## Blank release-date sync repair - 2026-11-08

- [x] Normalize provider/legacy blank episode airdates to unknown, preserve all other fields and strict malformed-date checks.
- [x] Automatically repair stored blank airdates before sync and distinguish data-validation failures from true library conflicts.
- [x] Verify the owner's exported snapshot (178 shows / 4,568 episodes): exactly one blank-date normalization, all other values identical. Preserve the exported file.
- [ ] Owner acceptance: update/reopen PC and phone, confirm Up to date across your signed-in devices without selecting a complete-library replacement.

## Binge sections and Match - 2026-11-08

- [x] Ready with Watching now / Watch soon / alphabetical Everything else; Upcoming & TBA; reversible Not for me.
- [x] Preserve legacy order, notes/history and automatic availability/Weekly rules; protect section changes across refresh/restore/sync.
- [x] Dedicated unmatched-only Match tab; Import handles files; setup returns to filtered Match queue.
- [x] Format-2 backups/shared snapshots retain sections, with format-1 import compatibility and old-client safety fence.
- [x] Update readable folder export and current code/status documentation.
- [x] Owner reported v0.4.1 sync recovery (Up to date) before this release; phone recovery was not separately reported.
- [ ] Owner checks v0.5.0 on PC and phone: update both, move a show, verify shared section/order and offline reconnect.
- [x] Dragging delivered v0.7.0; A-Z rail, final styling/dialogs and real assistive-tech/zoom acceptance remain.

- [x] Superseded by the approved original v0.6.0 splash/banner milestone below. Historical plan: Claude is preparing splash/title screen and optional PC banner designs (owner plan 2026-11-08). Review/integrate later; keep splash brief and nonblocking, with offline/reduced-motion support. No implementation claimed.

2026-11-08 design follow-up: owner proposes a movie-style spotlight sweeping across a wall/stage/screen to reveal Watchlist. Claude is preparing the splash and possible PC banner assets. This is a proposed visual concept, not built or a reason to delay library access; use a brief nonblocking reveal and a static reduced-motion state. Final assets still need review.

## Compact phone controls - 2026-11-08

- [x] Put utilities in More on phones; retain bottom primary navigation, direct search and visible warnings/update actions.
- [x] Compact healthy account/sync information; omit empty Ready groups and reduce control whitespace.
- [x] Verify 320px/412px content visibility, keyboard menu/focus behavior and backup restore cancellation on disposable data.
- [ ] Owner verifies the updated layout on the actual phone recording's device after v0.5.1 update.

## Original splash and Weekly launch - 2026-11-08

- [x] Preserve approved original assets and integrate dark Brick alley/Gold banner, local Limelight, dark manifest colours and offline/public allowlist.
- [x] Keep original flash/five-second timing and safe reduced-motion/forced-colours/failure cleanup; retain compact phone utilities.
- [x] Default to Weekly and rotate from today in Central time, skipping empty days.
- [x] Automated verification: 234 unit, 39 browser, eight PWA, hosted privacy and both builds/privacy guard. Published Hosting-only; live asset hashes match the tested build.
- [ ] Owner checks actual Android portrait/landscape smoothness and banner after updating.
- [x] Dragging delivered v0.7.0 after the splash/banner milestone.

## Card dragging/activity order and revised priorities - 2026-11-08 08:58 America/Chicago

- [x] Implement shared guarded drag/arrow ordering, PC/touch/keyboard handles, edge scrolling, cancel and filtered-list safety.
- [x] Implement started-first Binge grouping, recent-activity defaults, manual override and Recent reset.
- [x] Verification passed (244 unit, 44 browser, nine PWA, hosted privacy, 13 rules, six SDK integration, builds/privacy guard); Published Hosting-only to genre-watchlist; live index, service worker and all app JS/CSS match the tested build. Restarted the authorized read-only folder watcher with renderer/validator 3; refreshed shared revision 79 (196 shows). No rules, billing, personal history or original master changes. Actual Android Firefox/TalkBack dragging acceptance remains.
- [ ] Actual Android Firefox drag/scroll/TalkBack and desktop screen-reader acceptance.
- [ ] Family/private accounts and social recommendations deferred until the core is complete.
- [ ] Plan movie support: metadata source, film tracking/import, released/upcoming/theatrical placement and matching. Provider and API-credit choices remain undecided.
- [ ] Discuss API-credit use after core/movie requirements are clear; no AI dependency for ordinary tracking.

## Small future possibilities - 2026-11-08

- [ ] Maybe: repeat Caught up below the episode list. Owner says the existing top selector is fine; this is optional, not a requested implementation.
- [ ] Proposed for discussion: one Check shows for updates button for a manual whole-library metadata check. Current behavior is daily due checks while visible/online plus Refresh metadata in individual show details. A renewal/cancellation announcement feed and independently confirmed cancellation handling remain separate future work; no provider or API-credit feature chosen.

## Delivered v0.8.0: Binge genre checkboxes - 2026-11-08

- [x] Superseding the earlier deferral: Binge Genres menu, OR checkboxes/search, all saved genre badges and approved palette; focused checks passed.

## Brainstormed card controls - 2026-11-08

- [x] Owner approved implementation: Drag below left tile, Manage lower, right-middle arrows and explicit-Apply card episode/Caught up picker delivered in v0.8.0; automated responsive and interaction checks passed. Real Firefox/Android and assistive-technology acceptance remain.

- [ ] Movie implementation planning reference: ten-step recommended plan and official source requirements are now in DESIGN_IDEAS.md (2026-11-08). Planning only; TVmaze replacement is not required.

- [ ] Optional future review: choose any worthwhile U01–U15 ideas from POTENTIAL_UPGRADES.md. Brainstorming only; no implementation requested.
