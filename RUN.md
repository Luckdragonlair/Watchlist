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

The library is stored in IndexedDB for the browser and origin you use. Data in `127.0.0.1:5174` is separate from data on another host, port, browser, or deployed site. The app exports format-2 Watchlist JSON backups and restores both format 1 and format 2.

The normalized working catalog contains **298 active installments across 206 titles** (historically 301 / 208). It excludes all **5 Silo entries**; Silo remains in the preserved original master list and is intentionally not seeded. Catalog entries begin as source rows awaiting a positive, per-title TVmaze match, so the matched library may initially be empty. The three owner-removed placeholders are omitted; see Notes/MASTER_REMOVALS.json. Source schedule and renewal claims are unverified until checked.

Keep `originals/Project Watchlist Master List.txt` unchanged. Use the normalized working copy at `public/master-working.json` for the app.

## Scope of this version

The approved Nightfall presentation, installable/offline support and PC/touch/keyboard card dragging are implemented. Remaining visual/accessibility acceptance, movies and recommendations are future work. The full Silo acceptance test remains open; no original Silo rows are seeded or used to overwrite manual onboarding progress.

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

## v0.5.0 section-format compatibility - 2026-11-08

Update Watchlist on PC and phone before continuing shared use. New snapshots/backups use format 2 to retain Binge sections; older format-1 backups remain readable. Older app versions reject the new shared format rather than dropping its fields. Database names and schema v3 are unchanged. Import handles working files; Match holds only unmatched entries. Reversible Not for me preserves viewing history. The read-only folder helper must run the updated code; restart it after this release so its validation and readable sections are current.

## v0.6.0 startup presentation - 2026-11-08

The original approved Brick alley splash and gold banner load from local/cached assets before Weekly. App/auth loading runs underneath; no external splash service or paid dependency is needed. The default launch view is Weekly; it rotates headings from today in America/Chicago. Internal navigation does not replay the splash. For updates, save drafts then choose Update and reload as usual. Tests use disposable contexts; splash-specific checks exercise the real animation, while unrelated library/fake-clock browser checks stub only the decorative startup script.

## v0.7.0 dragging and format-3 compatibility

Update PC and phone before shared use. Use visible Drag handles in the ordered Ready groups; arrows remain available. Keyboard: Space/Enter, Up/Down/Home/End, Space/Enter; Escape cancels. Started shows default to recent activity, with a saved manual override and Recent reset. New backup/shared payloads are format 3; old formats 1/2 remain readable. Database names/schema and the normal/dev ports stay unchanged. Restart the existing read-only export helper after updating its code, as described in LIBRARY_EXPORT.md.
