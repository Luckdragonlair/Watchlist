# Watchlist v0.8.0

A personal React + TypeScript + Vite app with an offline IndexedDB library (Dexie) and owner-only Firebase synchronization in the hosted version. The first Nightfall V2 presentation milestone is implemented: locally cached typography, dark surfaces, responsive cards and phone bottom navigation. V2 Binge sections, card dragging, activity-first order and the unmatched-only Match queue are implemented; final V2 refinements remain; see [the foundation checkpoint](Notes/NIGHTFALL_FOUNDATION.md).

Update PC and phone to v0.8.0 for format-3 order preference compatibility; older backups remain readable.

New in v0.8.0: richer genre accents and all genre badges; Binge's **Genres** checkboxes filter any selected genre alongside search. Drag is under the left letter tile. On a library card, choose **Your place** or **Caught up**, then **Apply**; selecting alone changes nothing. Caught up marks aired regular episodes while retaining future tracking.

Use [the hosted app](https://genre-watchlist.firebaseapp.com/) for shared PC/Android use. See [SYNC.md](SYNC.md) for the one-time transfer from the original local library and real-device acceptance steps. Your original local library is not uploaded automatically.

From `D:\Watchlist`, run `pnpm install`, `pnpm build`, then `pnpm start`. On this machine you can use `./run-watchlist.ps1` instead; it finds the bundled Node/pnpm tools. See [RUN.md](RUN.md) for setup, tests, and data-storage details.

Implemented: TVmaze candidate search and explicit import, metadata refresh, episode check-off and automatic advance, undo, already-watching catch-up, Weekly/Binge/Watched views, show details, persistent Binge arrow ordering, personal notes, and JSON backup export/restore with validation, preview, confirmation, and atomic replacement.

After a successful show import or master-list match, setup offers an optional current episode and personal notes. Save and continue returns to your starting list or import queue; Skip for now keeps the imported show and its existing progress/notes. Choosing an episode marks only earlier released regular episodes watched; the selected episode and later history stay unchanged. You can still change notes or catch up later in show details.

Weekly follows an actively releasing season even when older seasons are still unwatched. A future season stays out of Weekly until it starts; the next-to-watch episode and your watched history remain independent of placement.

To remove a matched show, open its detail and choose **Delete show**, then confirm. This removes its active app records and viewing history without rewriting the preserved original master or existing backup files. Re-adding starts with fresh progress.

The preserved master list has a separate normalized starting catalog: 298 active installments / 206 titles (historically 301 / 208), excluding every Silo entry. Source classifications, season labels, viewing assertions, and notes are retained. Metadata linking requires selecting the correct TVmaze show; unmatched entries remain visible and clearly labeled. The three owner-removed placeholders are omitted; see Notes/MASTER_REMOVALS.json. Silo is excluded from the starting catalog; the user has exercised manual onboarding at S3 E8, as recorded in the project notes.

Follow [the development roadmap](Notes/ROADMAP.md) for the ordered plan toward one-click Firefox use on Android and PC with shared progress. The original files are preserved in `originals/`; current project notes are in [Notes/README.md](Notes/README.md). The original master SHA-256 is recorded in [the import audit](Notes/MASTER_IMPORT_AUDIT.json).

Installable/offline app support is implemented. Open the normal app at `http://127.0.0.1:5174`, wait for Available offline, and use the browser install option if desired. The cached app can reopen with its local server stopped; saved tracking, ordering, details and backup/restore work offline. TVmaze search/import/refresh still need internet. See [OFFLINE.md](OFFLINE.md). Card dragging is available; completion recommendations remain future work.

Metadata is supplied by [TVmaze](https://www.tvmaze.com/), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); see [the API documentation](https://www.tvmaze.com/api). Dates/statuses reflect the provider and are not independent release verification. No code license has been selected.

A read-only helper can keep a private current app export in `Library/` on this PC. See [LIBRARY_EXPORT.md](LIBRARY_EXPORT.md) for start/stop commands, scope and reboot behavior. It preserves the original master and does not automatically edit the separate master Page.

## Caught up (v0.2.0)

In import setup or show details, choose **Caught up—all aired episodes watched**. Setup saves it with your notes; in details, click **Mark all aired episodes watched**. Only released regular episodes gain watched records. Future, special and unknown-release episodes stay unchanged, and existing watched timestamps are preserved. The show remains tracked: newly released known episodes re-enter the watch queue; automatic checks discover new provider episodes while the app is open and online. You can still refresh manually.

The header reads the release version from package.json. Git commits and content-based service-worker versions separately identify checkpoints and offline updates. Version changes keep existing database names and backup formats.

## Automatic episode checks (v0.3.0)

Tracked shows are checked against TVmaze when their last successful refresh is at least 24 hours old. Checks run on opening, returning to the app and reconnecting, plus periodically while it stays visible and online. A closed app does not run a scheduled server job; overdue checks resume when reopened. Requests run sequentially with spacing and retry backoff. Existing progress, notes, ordering and source history stay intact. Failed checks retain the previous snapshot.

Caught-up and Watched shows are included. TVmaze's Ended status does not distinguish cancellation from a normal ending, so it does not permanently disable checks. Confirmed-cancellation overrides and closed-app server checks remain future work; no cancellation facts are inferred. See [TVmaze's status definitions](https://www.tvmaze.com/faq/13/shows#show-status).

## Alphabetical titles (v0.4.0)

Leading A and The move to the end: A Bear becomes Bear, A; The Zebra becomes Zebra, The. Imports and metadata refreshes save this filed name. Existing saved shows display the same way and acquire the saved format on their next metadata refresh. Watched and alphabetical unmatched-title groups sort by the filed name; manual ordering remains primary. Library search accepts both title forms. An and words such as Theater stay unchanged. Provider IDs, original source text, notes and episode history are preserved.

## Unknown-date sync repair (v0.4.1)

TVmaze sometimes supplies an empty release date for an announced episode. Imports treat this as unknown; sync startup converts existing blank episode dates to null without changing notes, viewing history or other metadata. Legacy backups with this exact blank value remain usable. Malformed nonblank dates are still rejected, and saved-data validation errors no longer offer whole-library conflict replacement choices. After updating, sync resumes normally without restoring a backup or selecting a complete library. Actual differing edits still use the existing conflict review flow.

## Binge sections and matching (v0.5.0)

Binge opens on Ready: Watching now and Watch soon use saved arrow order; Everything else is alphabetical. Upcoming & TBA separates dated future episodes from shows without a known next date. Not for me hides a show from active lists without deleting history; its history remains in Watched. Use Manage on a Binge card or Watch list section in show details to move it. A section choice does not force an unavailable episode into Ready or an actively releasing show out of Weekly. Old unsectioned shows use Watch soon to preserve prior ordering; new imports start in Everything else.

Import adds files and shows retained/unmatched counts. Match, beside Import (also available on phones), shows only pending/review entries, with title filtering. Completed matches disappear from that queue after setup; source text and season assertions remain preserved. Matching stays explicit, with no automatic alias choices or new bulk batch.

Update Watchlist on both PC and phone. New exports/shared snapshots use backup format 2 to preserve sections safely; this app also reads old format-1 backups. Older app versions cannot read the new shared format and must update. IndexedDB names/schema stay the same; no library is reset. Superseded by v0.7.0: dragging is built and new snapshots use format 3; the A-Z shortcut remains future work.

## Compact phone header (v0.5.1)

On phones, More contains Import, Match, backup export/restore, installation/offline options and the release timezone. Weekly/Binge/Watched/Add stay in the bottom navigation. Healthy account/sync information uses a compact row. Offline problems, sync errors/conflicts and update actions remain visible outside More. Empty Ready groups no longer push populated sections down; if none are ready, one empty message is shown. Desktop utility controls remain directly visible. More supports keyboard open/Escape and restores focus when navigating.


## Original splash and Weekly launch (v0.6.0)

The owner approved Claude's original dark Brick alley (04) and Gold banner (07), with the original white flash and approximately five-second sweep/flash/fly-up sequence on each page launch. Shorter timing, softened flash and earlier logo flight were rejected previews and are not used. This supersedes the earlier proposed brief/nonblocking reveal: startup data/auth loading proceeds underneath, but the decorative overlay remains for the approved sequence. Navigation inside the app does not replay it. No sound or skip control. Reduced motion uses the original static/fade path (about 1.6 seconds); forced colours bypasses the scene. Independent JavaScript/CSS failure cleanup prevents a stranded overlay. Limelight, the brick image and all runtime files are local, hosted-allowlisted and cached offline. The manifest/theme background is #05070d.

The banner replaces the duplicate navigation wordmark; the version remains visible. Phone More/bottom navigation stay compact. Account and healthy sync status occupy the banner status area; expanded account, errors/invalid data/conflicts get a full-width row, preserving actions. No library data, matching, schema, backup format or sync rules change. Source files are preserved unchanged in design/claude-splash-banner with selected source SHA-256 hashes.

Weekly is the default on a fresh launch/reload. Weekday sections start with today in America/Chicago, then cycle forward through the week, skipping empty sections. Existing placement and per-day show order are unchanged. The clock updates every minute and immediately on focus/visible return; this is not a closed-app scheduler.

## Card dragging and activity order (v0.7.0)

Use Drag on Watching now/Watch soon cards with mouse or touch; the rest of each card scrolls normally. Keyboard users can pick up with Space/Enter, move with Up/Down/Home/End, drop with Space/Enter or cancel with Escape. Arrows remain available. Started Ready shows come first in Watching now, sorted by recorded watch activity. Drag or arrows saves your own order; Recent returns to activity order. Undo removes an episode’s activity. Untouched and alphabetical lists keep their rules. Update PC and phone: new backups/sync use format 3; formats 1 and 2 still restore. No database reset.
