CURRENT CHECKPOINT — 2026-11-08: v0.11.0 existing-show Manage genre editor passed three focused browser workflows and TypeScript; published Hosting-only; live assets verified. Setup selector is shipped v0.10.0. Existing-show editor is no longer unbuilt; earlier future-work statements below are historical. No schema/format change.

# Watchlist handoff for Quora

Updated: 2026-11-08 13:58 CST (America/Chicago)

CURRENT UPDATE — 2026-11-08, 2:23 p.m. America/Chicago: owner lifted the testing hold; setup genre selector passed 12 setup-save checks, three targeted browser scenarios and TypeScript. v0.10.0 is built and published, retaining format 4. Existing-show Manage editor remains future work. Earlier hold notes are historical.

Read this, then the complete root AGENTS.md before work. This is a documentation handoff because the owner's weekly allowance is low; it does not start a new feature. Use targeted reads/checks, no unnecessary helpers or full-suite reruns.

## Current verified checkpoint

- Canonical project: D:\Watchlist. Repository Luckdragonlair/Watchlist, main. Feature checkpoint c92c4b946dcc968bb4da4e098ffc4c6bd6528c78; this documentation checkpoint follows it. Local main and origin/main were identical with a clean tree at the start of this handoff; fetch/check again before editing.
- Shipped app v0.9.0 at https://genre-watchlist.firebaseapp.com/ . Use Update and reload on both PC and phone for format-4 compatibility. New snapshots/backups use format 4; versions 1/2/3 remain readable. Database schema v3, database names, cloud manifest version 1 and security rules are unchanged.
- User completed all 181 multi-genre choices. Applied them atomically at shared revision 161; exact server readback verified. Library still has 196 shows. All provider metadata, notes, viewing history/timestamps, ordering/section flags, sources, epoch and lifecycles were preserved. Do not reapply the batch as a test.
- Optional Preference.primaryGenre controls card accent and first badge. Other tags stay filterable; a personal choice survives provider genre retraction without altering provider metadata. No choice uses the previous fallback priority, also displayed first. Explicit Supernatural color is periwinkle.
- v0.8.1 compact cards are shipped: Manage in the identity/title block, Drag beneath the left tile, right-middle arrows, inline episode picker/Apply, guidance visible after selecting. Natural height, 44px targets and wrapping retained. v0.8.0 includes genre checkboxes and multi-genre badges. All earlier tracking, catch-up, periodic refresh, backup, sync, splash/Weekly launch, Binge sections/activity order and dragging remain built; root AGENTS.md has the full status table.

## Next work and boundaries

1. Natural follow-up for the owner to assign: primary-genre selection during match/import setup. Reuse personal preferences and preserve the existing atomic notes/current-episode/Caught up safeguards. The owner specifically postponed this until after existing-show review; review is now complete, the matching/setup picker is now verified and published in v0.10.0.
2. An existing-show primary-genre editor under Manage is still unbuilt. Confirm the desired scope when that task is assigned; do not imply it shipped with the bulk application.
3. Remaining V2 work: app icons, A-Z accessible adjustable control, final screen/dialog/status refinements and actual-device accessibility/zoom acceptance. Preserve accepted Nightfall references in design/nightfall-v2.
4. Movies remain planning only. FEATURE_PLAN.md and DESIGN_IDEAS.md describe adding TMDB alongside TVmaze, genre reuse, proper movie records, US release/availability distinctions and backup/sync changes. No movie provider setup or implementation is complete. Family access/social sharing and AI spending remain deferred.
5. POTENTIAL_UPGRADES.md contains optional brainstorms, not automatic implementation instructions. Historical estimates are not a current remaining-time forecast.

## Evidence and limits

v0.9.0: 155 checks across the affected genre/backup/restore/sync/maintenance unit modules passed (two test-fixture/version expectations corrected and rerun). Two browser workflows passed: primary badge/accent/filter/export/reload and legacy Binge backup behavior. One production-offline format-4 export/order workflow passed. TypeScript, normal/hosted builds and hosted private-asset guard passed. Live index, worker and all app JS/CSS matched the tested build. No unrelated rules/full-PWA/full-browser suites were rerun. Prior v0.8.1 has six focused compact-card workflows. Actual Firefox/Android/TalkBack acceptance is separate from isolated Edge automation and earlier owner-reported sync checks.

This documentation handoff did not rerun application tests or deploy code. It checked Git state and reconciled current summaries. No new blocker was found.

## Private state and helper processes

- Library/ is Git-ignored. Current JSON is backup format 4 and current readable Markdown includes effective primary genre; export-status.json recorded revision 161, renderer 4 on this handoff. Newer owner activity may change it: fresh-read, never seed over it.
- Submitted file: C:\Users\carpa\Downloads\Primary Genre Choices.json. Local autosave: Library/Primary Genre Choices.json. These are personal data, not source assets. Private before/choice/receipt snapshots are under ignored originals/primary-genres-*/. Never commit or publish them.
- Read-only export watcher last verified running as PID 24708. Use Start-LibraryExport.ps1 to start, -Stop to stop, -Once to refresh. Verify the process identity; PID can be reused. No reboot startup is installed. Restart after changing export validation/model code.
- PC-only review helper at http://127.0.0.1:5188, Start-GenreReview.ps1 / -Stop. It saves choices only and is not the hosted app or a live preference editor. No need to leave/reopen it for normal app use. Existing review is complete.
- Main production local origin: http://127.0.0.1:5174; development 5175. Test only disposable databases/profiles/ports. Original master hash: 6278d1781529929a12831005ec6b9922cfa0b68d11f7115360318748e3f0e5be. Preserve it byte-for-byte. Do not reseed Silo or overwrite its user-selected progress.
- Node/pnpm may not be on PATH; RUN.md and run-watchlist.ps1 document the bundled runtime. The review helper's focused check is node --test tests/genre-review.test.cjs. App test commands are in AGENTS.md; choose only the affected files first.

## Required finish for subsequent changes

Inspect canonical D:\Watchlist before using another checkout. Preserve dirty/unrelated work. Update AGENTS.md and affected notes in the same ordinary commit. Reconcile all project files into D:\Watchlist, then push a verified coherent feature under the standing authorization and verify remote/local equality. No amend, force-push, destructive history rewrite or private exports. Stop for genuine failures/conflicts/unclear scope; do not ask for already-authorized routine actions. Keep the owner's token budget in mind.

Owner reaffirmed during this handoff: perform documentation upkeep and proportional checkpoint checks after every GitHub update or sizeable change. This applies to every agent, every time; a handoff does not imply work is finished or paused.
