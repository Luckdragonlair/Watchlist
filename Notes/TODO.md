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

- [ ] Validated JSON backup restore/transfer with rollback and round-trip tests.
- [ ] Installable PWA and offline reopen: production app reopens offline with cached data and ordinary actions need no metadata requests.
- [ ] Smooth drag-and-drop plus Watch Now/Watch Soon, preserving manual Binge order.
- [ ] Completion recommendations from Binge with Skip/Pass/dismiss actions.
- [ ] Explicit specials, manual release corrections, richer season-level placement, unknown future seasons.
- [ ] Accessible modal focus management and Claude's final responsive design.
- [x] Connect D:\Watchlist to the existing Luckdragonlair/Watchlist Git history while preserving app files. No changes uploaded yet.
- [ ] Review and commit the tested v0.1 checkpoint in GitHub Desktop, then Push origin. Select a code license before public release; no deployment exists.
