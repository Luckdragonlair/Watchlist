# Watchlist v0.2.0

A personal React + TypeScript + Vite app with an offline IndexedDB library (Dexie) and owner-only Firebase synchronization in the hosted version. The first Nightfall V2 presentation milestone is implemented: locally cached typography, dark surfaces, responsive cards and phone bottom navigation. Full V2 section organization and drag-and-drop are still in progress; see [the foundation checkpoint](Notes/NIGHTFALL_FOUNDATION.md).

Use [the hosted app](https://genre-watchlist.firebaseapp.com/) for shared PC/Android use. See [SYNC.md](SYNC.md) for the one-time transfer from the original local library and real-device acceptance steps. Your original local library is not uploaded automatically.

From `D:\Watchlist`, run `pnpm install`, `pnpm build`, then `pnpm start`. On this machine you can use `./run-watchlist.ps1` instead; it finds the bundled Node/pnpm tools. See [RUN.md](RUN.md) for setup, tests, and data-storage details.

Implemented: TVmaze candidate search and explicit import, metadata refresh, episode check-off and automatic advance, undo, already-watching catch-up, Weekly/Binge/Watched views, show details, persistent Binge arrow ordering, personal notes, and JSON backup export/restore with validation, preview, confirmation, and atomic replacement.

After a successful show import or master-list match, setup offers an optional current episode and personal notes. Save and continue returns to your starting list or import queue; Skip for now keeps the imported show and its existing progress/notes. Choosing an episode marks only earlier released regular episodes watched; the selected episode and later history stay unchanged. You can still change notes or catch up later in show details.

Weekly follows an actively releasing season even when older seasons are still unwatched. A future season stays out of Weekly until it starts; the next-to-watch episode and your watched history remain independent of placement.

To remove a matched show, open its detail and choose **Delete show**, then confirm. This removes its active app records and viewing history without rewriting the preserved original master or existing backup files. Re-adding starts with fresh progress.

The preserved master list has a separate normalized starting catalog: 301 installments / 208 titles, excluding every Silo entry. Source classifications, season labels, viewing assertions, and notes are retained. Metadata linking requires selecting the correct TVmaze show; unmatched entries remain visible and clearly labeled. `Re S3` and `Re S4` need identification. Silo is excluded from the starting catalog; the user has exercised manual onboarding at S3 E8, as recorded in the project notes.

Follow [the development roadmap](Notes/ROADMAP.md) for the ordered plan toward one-click Firefox use on Android and PC with shared progress. The original files are preserved in `originals/`; current project notes are in [Notes/README.md](Notes/README.md). The original master SHA-256 is recorded in [the import audit](Notes/MASTER_IMPORT_AUDIT.json).

Installable/offline app support is implemented. Open the normal app at `http://127.0.0.1:5174`, wait for Available offline, and use the browser install option if desired. The cached app can reopen with its local server stopped; saved tracking, ordering, details and backup/restore work offline. TVmaze search/import/refresh still need internet. See [OFFLINE.md](OFFLINE.md). Drag-and-drop and completion recommendations remain future work.

Metadata is supplied by [TVmaze](https://www.tvmaze.com/), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); see [the API documentation](https://www.tvmaze.com/api). Dates/statuses reflect the provider and are not independent release verification. No code license has been selected.

A read-only helper can keep a private current app export in `Library/` on this PC. See [LIBRARY_EXPORT.md](LIBRARY_EXPORT.md) for start/stop commands, scope and reboot behavior. It preserves the original master and does not automatically edit the separate master Page.

## Caught up (v0.2.0)

In import setup or show details, choose **Caught up—all aired episodes watched**. Setup saves it with your notes; in details, click **Mark all aired episodes watched**. Only released regular episodes gain watched records. Future, special and unknown-release episodes stay unchanged, and existing watched timestamps are preserved. The show remains tracked: newly released known episodes re-enter the watch queue; refresh metadata to discover new provider episodes.

The header reads the release version from package.json. Git commits and content-based service-worker versions separately identify checkpoints and offline updates. Version changes keep existing database names and backup formats.
