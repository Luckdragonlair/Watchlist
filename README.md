# Watchlist v0.1

A personal React + TypeScript + Vite app with a browser-local IndexedDB library (Dexie). The interface deliberately uses plain boxes and buttons; Claude will handle visual design.

From `D:\Watchlist`, run `pnpm install`, `pnpm build`, then `pnpm start`. On this machine you can use `./run-watchlist.ps1` instead; it finds the bundled Node/pnpm tools. See [RUN.md](RUN.md) for setup, tests, and data-storage details.

Implemented: TVmaze candidate search and explicit import, metadata refresh, episode check-off and automatic advance, undo, already-watching catch-up, Weekly/Binge/Watched views, show details, persistent Binge arrow ordering, personal notes, and JSON backup export/restore with validation, preview, confirmation, and atomic replacement.

To remove a matched show, open its detail and choose **Delete show**, then confirm. This removes its active app records and viewing history without rewriting the preserved original master or existing backup files. Re-adding starts with fresh progress.

The preserved master list has a separate normalized starting catalog: 301 installments / 208 titles, excluding every Silo entry. Source classifications, season labels, viewing assertions, and notes are retained. Metadata linking requires selecting the correct TVmaze show; unmatched entries remain visible and clearly labeled. `Re S3` and `Re S4` need identification. Silo is excluded from the starting catalog; the user has exercised manual onboarding at S3 E8, as recorded in the project notes.

The original files are preserved in `originals/`; current project notes are in [Notes/README.md](Notes/README.md). The original master SHA-256 is recorded in [the import audit](Notes/MASTER_IMPORT_AUDIT.json).

Installable/offline app support is implemented. Open the normal app at `http://127.0.0.1:5174`, wait for Available offline, and use the browser install option if desired. The cached app can reopen with its local server stopped; saved tracking, ordering, details and backup/restore work offline. TVmaze search/import/refresh still need internet. See [OFFLINE.md](OFFLINE.md). Drag-and-drop and completion recommendations remain future work.

Metadata is supplied by [TVmaze](https://www.tvmaze.com/), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); see [the API documentation](https://www.tvmaze.com/api). Dates/statuses reflect the provider and are not independent release verification. No code license has been selected.
