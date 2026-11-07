# Run Watchlist

## Start the app

The project uses Node.js, React, and Vite. From the project folder, install dependencies and start the development server:

```powershell
pnpm install
pnpm build
pnpm start
```

Open `http://127.0.0.1:5174`. The fixed development port keeps your browser library at the same address between sessions. The repository includes `pnpm-lock.yaml`, so pnpm is preferred for a reproducible install. If pnpm is unavailable, `npm install`, `npm run build`, and `npm start` are alternatives. On the current handoff machine, npm and pnpm are not on PATH; use `./run-watchlist.ps1` from PowerShell. To install explicitly, use `./run-watchlist.ps1 -Task install`.

## Tests and build

```powershell
pnpm test       # unit tests
pnpm test:e2e   # browser tests
pnpm build      # type-check and production build
```

The browser tests are configured for the Microsoft Edge channel (`msedge`). Install Edge if it is missing, or change the Playwright channel configuration to use a browser installed on your machine.

## Local data and catalog

Open a matched show's detail and select **Delete show** to remove it, then confirm. Removal covers metadata, viewing history, personal notes/order and linked source entries, and stays removed after reload. Original source files and previously exported backups remain unchanged. A fresh explicit import can add the show again with no old progress.

The library is stored in IndexedDB for the browser and origin you use. Data in `127.0.0.1:5174` is separate from data on another host, port, browser, or deployed site. The app exports and restores version-1 Watchlist JSON backups.

The normalized working catalog contains **301 installments across 208 titles**. It excludes all **5 Silo entries**; Silo remains in the preserved original master list and is intentionally not seeded. Catalog entries begin as source rows awaiting a positive, per-title TVmaze match, so the matched library may initially be empty. `Re S3` and `Re S4` remain flagged for manual identification. Source schedule and renewal claims are unverified until checked.

Keep `originals/Project Watchlist Master List.txt` unchanged. Use the normalized working copy at `public/master-working.json` for the app.

## Scope of this version

The UI is a functional placeholder; Claude owns the visual design. Installable/offline app support is implemented; recommendations and drag-and-drop reordering are deferred. The Silo mid-season onboarding test is intentionally pending; no Silo data is seeded.

## Export a backup

Click Export backup. The result appears beside the button and scrolls into view. Look in your browser's Downloads folder for a timestamped watchlist-backup JSON file, or use Download backup file again. The app can prepare and request a download, but cannot confirm the browser's final save location. Restore backup is available beside Export backup.

## Restore a backup

1. Click Restore backup at the top right and choose a Watchlist JSON backup (up to 50 MB).
2. Review the saved date and the counts of shows, episodes, viewing records and source entries. Choosing a file does not change your library.
3. If you want to preserve your current state, use Export backup inside the preview first.
4. Tick Replace my current library with this backup, then click Replace library and restore. This replaces rather than merges all six user-data collections, including personal notes, ordering and import sources.

Cancel restore or Escape closes the preview without changes. Invalid or unsupported files are rejected before writing. If storage fails, the replacement transaction rolls back. A deliberately empty backup stays empty after reload instead of reloading the starter catalog. Restore uses no network. Requests already running in other tabs cannot overwrite the restored library.

Backup format version 1 remains supported, including older exports without viewing-record show ownership. Database schema v3 adds only internal initialization/revision settings; existing viewing timestamps are preserved. No restore is automatically performed on the user's saved library during development or testing.
## Offline/installable app

The default ./run-watchlist.ps1 now builds and serves the production app at http://127.0.0.1:5174. Wait for Available offline on the first load. Once cached, this app can reopen with the local server stopped, including after a full browser restart; local tracking, details, ordering and backup/restore need no network. First load and app updates need the local server running. TVmaze functions require internet.

For installation, use Install app when offered, or How to install for browser instructions. Normal Edge/Chrome support installation; the in-app browser may not expose the install option. A different browser has a separate library, so export current progress and restore it there to transfer data. No OS installation was performed during development.

Development is now pnpm dev at http://127.0.0.1:5175, with no service worker and a separate test library. Keep your normal data at 5174. Updates do not force a reload while you work: use Update and reload after saving open notes, or close all app windows to allow a waiting update to activate before next launch. See OFFLINE.md.

Run production PWA tests with pnpm build followed by pnpm test:pwa, or ./run-watchlist.ps1 -Task test:pwa. Those tests use disposable browser profiles and local test servers, never the user's library. No deployment, accounts, or cross-device sync has been created.

For the optional private current-library folder export, run `./Start-LibraryExport.ps1` (Windows-session watcher), `-Once` (single export) or `-Stop`. See LIBRARY_EXPORT.md. No Windows-login startup task is installed.
