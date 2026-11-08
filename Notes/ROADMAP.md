# Watchlist development roadmap

Updated: 2026-11-08 04:20 CST (America/Chicago)

This is the living development plan from the original prototype to a dependable first release. It tracks verified progress, remaining work and initial effort estimates. AI maintains the status marks, timestamps and estimate changes.

## The finished experience

One-click Watchlist access on an Android phone and a Windows PC, with Firefox as a primary compatibility target. The same library, episode progress, notes and Binge order stay synchronized across devices. Ordinary tracking works offline and reconciles when reconnected. Installation uses an app icon/window where supported; routine use should not require finding a browser tab or starting a PC development server.

The current local-first PWA is the foundation. Hosted access is published for trial use. Automatic cross-device sync is deployed and passes automated tests. Personal migration and core PC/phone notes/offline reconnect checks passed by user report. Dragging, remaining progress/order/recovery and accessibility acceptance, recommendations and final visual refinements remain unfinished.

## Progress at a glance

**Current focus:** Steps 7 and 9 — Binge sections and Match are built; accessible dragging is next, followed by the A-Z control and final screen/dialog refinements. Update PC and phone to v0.5.0 for section-compatible sync. Approved Nightfall references are in design/nightfall-v2. Claude is preparing splash/banner design assets separately.
**Target:** one-click use on Android and Windows, a shared private library, and dependable offline tracking.

Marks: **[x] complete** · **[~] partly complete** · **[>] next** · **[ ] not started** · **[!] blocked**. A blocked mark must name the blocker. No milestone is currently marked blocked; future steps depend on the decisions and checks below.

| Step | Milestone and progress | ETA for remaining work | Last verified progress |
| --- | --- | --- | --- |
| 1 | [x] Product rules and preserved source foundation | Complete; source identity cleanup continues in step 8 | 2026-11-05; time not recorded |
| 2 | [~] Local tracker implemented; remaining manual acceptance open | Implementation complete; remaining checks included in steps 8 and 10 | 2026-11-06; time not recorded |
| 3 | [~] Backup and offline foundation tested in Edge; target-device checks open | Implementation complete; Firefox taskbar and internet-disconnected reopen confirmed; server-stopped and Android checks remain | 2026-11-06; time not recorded |
| 4 | [~] Firefox PC checks passed; Firebase Spark chosen; access/security design underway | 1–2 sessions; Android acceptance follows hosted access in step 5 | 2026-11-06 07:00 CST; user confirmed internet-disconnected reopen |
| 5 | [~] Hosted trial published; live unsigned-in shell verified; device acceptance and migration remain | About 1 session for device checks; migration depends on sync readiness | 2026-11-06 08:03 CST |
| 6 | [~] Sync deployed; migration, live two-way notes and offline reconnect passed by user report | Remaining progress/order/recovery checks included in step 10 | 2026-11-07; see SYNC_ACCEPTANCE_2026-11-07.md |
| 7 | [>] Watching now/Watch soon section arrows and shared saved order built; accessible dragging next | 1-2 focused sessions, subject to device acceptance | 2026-11-08 04:20 CST |
| 8 | [~] Setup, caught-up action, daily metadata checks and Match queue built; held titles/manual acceptance remain | Manual review as needed; recommendations remain deferred | 2026-11-08 04:20 CST |
| 9 | [~] Nightfall foundation, Binge sections and Match complete; drag/A-Z, final styling and accessibility remain | 2-4 focused sessions; overlaps step 7, not additive | 2026-11-08 04:20 CST |
| 10 | [~] Core real-device sync passed; remaining section/progress/order/recovery and accessibility acceptance open | 1-3 sessions after steps 7-9; defects may revise estimate | 2026-11-08: owner reported sync recovered after v0.4.1 |

### How to read the estimates

A focused session means roughly **1–2 hours of active development or testing**, including user device checks when needed. Estimates are initial planning judgments, not measured delivery commitments. Waiting for decisions, accounts, Claude design or device access does not count as active work.

The remaining plan totals approximately **12–26 focused sessions**, or **12–52 active hours**, assuming the current TV-focused scope and no major redesign. Calendar completion is **not scheduled**. For illustration, at one session per working day this is roughly 3–6 working weeks after work resumes; this is a pace example, not a promised release date. Movies, a packaged native app, expanded recommendations or major sync defects require re-estimation.

Each ETA starts when its prerequisites are ready. The AI should revise the remaining estimate after meaningful progress and record why it changed. Completed steps show completion rather than a future ETA. Earlier records contain dates without times; the tracker preserves that distinction rather than inventing times.

## Milestone details

### 1. Product and source foundation

Completed: preserve original notes/master, normalize 301 installments across 208 titles, exclude all five Silo rows from the starting catalog, establish metadata/viewing-state separation and record the product decisions.

Remaining source cleanup continues alongside development: identify `Re S3` / `Re S4`, confirm ambiguous series matches, and verify source schedule/status assertions. These assertions must never become confirmed facts merely through import.

### 2. Local tracking

Implemented: TVmaze candidate selection/import/refresh, independent season/episode/history records, next available unwatched episode, check-off/advance/undo, explicit catch-up, Weekly/Binge/Watched, personal notes and complete show removal.

The user has exercised matching, deletion, Silo catch-up/advance/return/reload, and The Handmaid's Tale completion. The full Silo acceptance checklist remains open for its remaining count, placement, refresh and completion checks; do not label the whole test passed prematurely. The actual Silo run is S3 E8, superseding its original S2 E8 plan.

### 3. Data protection and offline foundation

Implemented: versioned JSON export, validated restore preview/confirmation, atomic rollback, controls at the top right, install manifest/icons, offline shell, safe updates and offline tracking/backup/restore.

Verified checkpoint: 100 unit/database/validation tests, 13 regular browser workflows and four production offline/update workflows passed. The production tests include a full browser restart with the test server stopped. These are Edge results, not proof of actual Firefox/Android installation.

### 4. Firefox access and architecture decisions — next

Before choosing a hosting service or building sync:

- Verify app-style launch on the user's Firefox Windows and Android setup, plus the essential tracking/offline/backup flows. Update installation guidance to include Firefox.
- Keep an installed PWA as the first delivery approach. Consider a packaged app only if real-device checks show it is needed for the requested one-click experience.
- Choose where the app and private synchronized library will live, how the user's devices identify the same library, and what any ongoing cost would be.
- Define offline conflicts, deletion propagation, restore behavior and account/device recovery before implementing them.
- Decide the first release's scope for movies/standalone installments. The current implementation is TV-focused even though the original product vision also mentions movies.

Done when: there is a concrete hosting/access/sync design with its costs and tradeoffs, and a verified Firefox launch path. Record the selected decisions in DECISIONS.md. No provider or paid service is selected by this roadmap.

### 5. Hosted access on both devices

- Give the app one stable HTTPS address reachable from the PC and phone.
- Keep personal library/progress private. Do not expose the personal master seed simply by publishing the current static build.
- Provide the chosen access/device-identification flow, deployment process and safe app updates.
- Transfer the existing local library through a verified backup/migration without losing history or manual order.

Done when: either device can open/install the app from the shared address, and phone access works with the PC switched off. Hosting the app alone does not count as data synchronization.

### 6. Shared library and progress

- Synchronize titles, watched/unwatched changes, personal notes and manual Binge order.
- Preserve local offline use and upload/reconcile changes on reconnect.
- Propagate deletions; an older offline device must not resurrect a deleted show.
- Make conflicting edits and full-library restores deterministic and understandable. Do not silently discard user choices.
- Keep metadata refresh separate from personal state and support recovery when a device is lost or replaced.

Done when: changes made on Android appear on PC and vice versa; offline/reconnect, conflicting edits, delete and restore scenarios pass real-device checks. Manual backup transfer is not the everyday sync solution, and Firefox Sync is not the app's sync mechanism.

### 7. Finish Binge interactions

- Add visible, smooth card dragging with touch, mouse and keyboard alternatives.
- Put up/down reorder arrows on the right edge, vertically centered on each card.
- Make dragging and arrows update the same persistent order; keep detail links and episode checkboxes easy to use.
- Verify ordering after filtering, reload, metadata refresh, backup/restore and cross-device sync.
- Add the agreed Watch Now / Watch Soon priorities without unexpectedly overriding manual positions.

Done when: a reorder remains correct offline, after reopening, and on the other device. Claude handles final appearance; behavior and data rules remain independently testable.

### 8. Finish library and next-watch behavior

- Complete the agreed completion prompt and recommendations from the user's own Binge entries.
- Add Watch Now, Watch Soon, Skip, Pass and dismiss behavior; saving watched progress must not depend on acknowledging a prompt.
- Complete the later spelling/alias search idea: search on TVmaze, then confirm the chosen series link/ID before importing.
- Resolve remaining onboarding/import ambiguities and the agreed season/installment presentation, specials and manual metadata corrections.
- Preserve unknown release/status facts and Central Time display rules.

Done when: the agreed completion, onboarding and library scenarios pass without requiring AI or inventing provider facts. See TODO.md and TEST_CASE_SILO.md for the detailed remaining checks.

### 9. Claude's design and accessibility

Hand over the working screens, agreed interactions, data constraints and acceptance examples. Claude designs the cards, layout, typography, colors, icons and responsive presentation; integrate that design without changing progress/sync behavior.

Verify touch targets, keyboard use, focus/dialog behavior, contrast, reduced-motion behavior and both device layouts. Visual exploration can happen earlier, but final integration follows stable functional contracts to limit rework.

Done when: the user approves the PC and Android experience, including the right-middle arrows, and the existing behavior tests still pass.

### 10. First dependable release

- Run the full automated checks and real Firefox Windows/Android acceptance checklist.
- Test upgrades and recovery with an existing library, not only an empty install.
- Confirm one-click launch, PC-off phone use, offline reopening, two-way sync, deletions, ordering and backup/restore.
- Close remaining blocking bugs and document any intentionally deferred scope.
- Finish setup/help instructions, choose the code license before public release, and create a named Git release checkpoint when authorized.

Done when: the user can use Watchlist day to day on both devices without developer tools, manual routine data transfers, or losing progress through updates/offline changes. This is the first release's finish line, not a promise that every future idea is already included.

## How we use this roadmap

- Follow these milestones in order unless a blocker or explicit user decision changes the priority.
- Keep detailed tasks in TODO.md, product rules in DECISIONS.md and evidence/results in PROGRESS.md. This file is the overview.
- Test each meaningful feature, then commit/push at working checkpoints when authorized.
- Update the roadmap when scope changes instead of quietly adding new requirements to the release.

**Next concrete task:** verify Firefox app access on the two target platforms and prepare the hosting/synchronization choices for review. This roadmap authorizes no deployment, account setup, paid service or further feature implementation by itself.

## Updating this tracker

The AI maintains this document at every meaningful checkpoint; the user does not need to mark it manually.

1. Change the relevant status mark only when the work or evidence warrants it. Implementation and real-device acceptance are separate.
2. Record the actual progress timestamp as `YYYY-MM-DD HH:mm CST/CDT (America/Chicago)`, with the supporting test, user report or saved checkpoint. A document edit alone is not implementation progress.
3. Update the remaining ETA and dependencies. Preserve the previous forecast and reason for a change in the log.
4. Append a dated log entry; do not rewrite earlier entries. Use `time not recorded` for older evidence that lacks a time.
5. Keep detailed task marks in TODO.md and test evidence in PROGRESS.md consistent. Preserve the Silo holdout and partial acceptance status.
6. Set [x] only when the milestone's done criteria are satisfied. Keep the next concrete task visible.

For each future entry use: **Timestamp | Step | Change and evidence | Remaining ETA or forecast change**.

## Dated progress log

| Timestamp in America/Chicago | Step | Change and evidence | Remaining ETA |
| --- | --- | --- | --- |
| 2026-11-05; time not recorded | 1–2 | Preserved originals, normalized catalog and delivered local tracker; evidence in PROGRESS.md | Foundation complete; manual acceptance remains |
| 2026-11-05; time not recorded | 3 | Backup/restore implementation and user-reported restore check recorded in PROGRESS.md | Offline work and device checks remained at that checkpoint |
| 2026-11-06; time not recorded | 2–3 | User reported Handmaid's Tale completion; offline checkpoint records 100 unit, 13 browser and 4 PWA tests passing in Edge | Firefox/Android verification remains |
| 2026-11-06 05:45 CST | All | Converted the existing roadmap into this status and ETA tracker. No new implementation or tests performed for this documentation update | Initial remaining estimate: 12–26 sessions |
| 2026-11-06 06:53 CST | 4 | Inspected Firefox 159.0.1 on PC; checked Mozilla guidance; updated installation help. Actual device acceptance remains open; Android test follows hosting. | 1–2 sessions; architecture choice open |
| 2026-11-06 06:58 CST | 4 | User reported Firefox loaded successfully and taskbar web-app setup worked. Offline status, reopening from the shortcut and Android acceptance remain unverified. | 1–2 sessions; hosting and sync decisions still open |
| 2026-11-06 07:00 CST | 4 | User reported the instructed Firefox taskbar reopening check with internet disconnected worked. This does not establish reopening with the local launcher stopped. Android and hosting/sync design remain open. | 1–2 sessions; architecture decision next |
| 2026-11-06 07:02 CST | 4 | Prepared [hosting and sync proposal](HOSTING_PLAN.md): Firebase Spark, owner-only data, explicit migration and offline sync design. Awaiting provider/sign-in selection; not deployed. | 1–2 sessions; estimates unchanged |
| 2026-11-06 07:21 CST | 4–6 | User selected free Spark and Google sign-in and created Genre-Watchlist. Prepared isolated hosted sign-in/build, private seed exclusion, disabled-write rules and pure sync protocol. Live sign-in, deployment, rules emulator and automatic sync remain open. | Step 4: about 1 session; hosting: 1–3; sync: 4–8; provisional |
| 2026-11-06 07:28 CST | 4–5 | Observed live Google sign-in in the in-app browser; bound owner UID locally and rebuilt the hosted setup. Owner-library opening after update, deployment, Firefox/Android sign-in and full sync remain open. | Architecture about 1 session; hosting 1–3; sync 4–8; provisional |
| 2026-11-06 07:30 CST | 4–5 | User confirmed the owner-bound local library opens after update. Live in-app Google sign-in and local owner access passed; Firefox/Android sign-in, deployment, security-rule emulator and sync remain open. | Hosting 1–3 sessions; sync 4–8; provisional |
| 2026-11-06 07:36 CST | 5–6 | User screenshot confirms empty default Firestore database created on Spark. Deployed rules, edition/location, app deployment and actual synchronization remain to verify. | Hosting 1–3 sessions; sync 4–8; provisional |
| 2026-11-06 07:56 CST | 4–6 | User confirmed live deny-all rules; 5 local owner/access-denial tests passed. Portable Java resolved emulator prerequisite. CLI login and read-only project access verified; live hosting/sync remain unfinished. | Hosting 1–3 sessions; sync 4–8; provisional |
| 2026-11-06 07:57 CST | 5–6 | Project-local Firebase CLI access verified and all 5 emulator rule tests plus TypeScript pass from D:\Watchlist. No live data writes or deployment performed. | Hosting 1–3 sessions; sync 4–8; provisional |
| 2026-11-06 08:03 CST | 5 | Published hosting-only build to https://genre-watchlist.firebaseapp.com/ after confirming billing disabled. Live isolated browser checks passed for sign-in screen, unsigned offline shell, manifest and private master exclusion. No library migration, Firestore rule change or sync enabled. | About 1 session for device checks; sync 4–8 sessions; provisional |
| 2026-11-06 08:20 CST | 5 | Published same-window Google sign-in and clearer auth feedback after user reported popup flashing. Live button-to-handler navigation passes; user completion/target-device checks remain open. | About 1 session for device acceptance; sync estimate unchanged |
| 2026-11-06 08:29 CST | 3, 5 | Fixed offline router intercepting Firebase auth helpers. Regression fails on old build and passes on fixed build; all 5 PWA tests and live warm-cache helper/sign-in navigation pass. User login completion remains open. | Device acceptance still open; sync estimate unchanged |
| 2026-11-06 08:35 CST | 5 | User confirmed hosted sign-in works after the routing fix. Stuck sign-in issue resolved by user report; device-specific installation/offline acceptance and sync/migration remain open. | Device checks about 1 session; sync 4–8 sessions; provisional |
| 2026-11-06 10:27 CST | 5–6 | Deployed tested owner-only sync and strict atomic snapshot rules after confirming billing disabled. Full automated suite passes; original library remains untouched. Fresh-backup migration and actual Firefox/Android two-way/offline acceptance are next. | Revised sync estimate from 4–8 sessions to about 1–2 remaining for acceptance/fixes after implementation |
| 2026-11-06 10:32 CST | 5–6 | User confirmed hosted PC/phone launch, automatic phone sign-in and signed-in return after app update. Personal migration and two-way saved data/offline acceptance remain to confirm. | About 1–2 acceptance/fix sessions; unchanged |

## Nightfall checkpoint - 2026-11-07 08:20 CST

- [x] Preserve approved V2 reference bundle and implement the visual foundation; local fonts, responsive shell/cards and right-centered arrows verified. See NIGHTFALL_FOUNDATION.md.
- [~] Step 9 is now in progress. Remaining estimate: 2-4 focused sessions for persistent Binge sections, accessible dragging/A-Z, final screen refinements and accessibility validation. This replaces the former Not started status for step 9; no completion date is promised.
- [x] Core real-device notes synchronization and reconnect delivery passed by user report; see SYNC_ACCEPTANCE_2026-11-07.md. Other real-device acceptance remains separate.

## Import setup improvement - 2026-11-07 10:05 CST

- [x] Post-match/import current-episode and notes setup, return to origin, skip and concurrency guards implemented and verified. This completes that requested onboarding improvement; broader step 8 work remains.
- [x] V2 Binge section organization completed 2026-11-08; this supersedes the earlier next-step note. Accessible dragging is next.

## 2026-11-08 - Binge/Match checkpoint

- [x] Ready / Watching now / Watch soon / Everything else; Upcoming & TBA; reversible Not for me; persistent arrow order and preserved history.
- [x] Dedicated unmatched-only Match tab; Import for files; post-match setup returns to the filtered queue.
- [x] Format-2 snapshots/backups retain section choices, accepting old format 1 and safely excluding old app readers. Update both devices.
- [x] Automated verification: 232 unit tests, 30 browser workflows, 6 PWA workflows, 13 rules/access tests, 5 SDK integration tests, hosted privacy check and both builds. Fictional phone layout inspected.
- [ ] Owner v0.5.0 PC/Android section/order/offline acceptance.
- [>] Accessible dragging; next A-Z shortcut and final screen/dialog/status refinements.
- [ ] Claude's splash/title screen and optional PC banner are planned design assets, not implemented features. Review assets before integration; keep splash brief/nonblocking and support reduced motion/offline use.

Historical entries above remain as checkpoints; the current summary and this dated checkpoint supersede their old pending items where explicitly completed here.

## 2026-11-08 - Phone layout correction (v0.5.1)

- [x] Compact More utility menu, healthy cloud row, direct search/bottom navigation and omission of empty Ready groups.
- [x] Fictional 320px/412px geometry and menu/backup workflow verified; private phone recording inspected.
- [ ] Owner checks actual Android layout after updating. This presentation correction does not change the next planned accessible-dragging milestone or its estimate.
