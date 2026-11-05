# Run Watchlist

## Start the app

The project uses Node.js, React, and Vite. From the project folder, install dependencies and start the development server:

```powershell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5174`. The fixed development port keeps your browser library at the same address between sessions. The repository includes `pnpm-lock.yaml`, so pnpm is preferred for a reproducible install. If pnpm is unavailable, `npm install` and `npm run dev` are alternatives. On the current handoff machine, npm and pnpm are not on PATH; use `./run-watchlist.ps1` from PowerShell. To install explicitly, use `./run-watchlist.ps1 -Task install`.

## Tests and build

```powershell
pnpm test       # unit tests
pnpm test:e2e   # browser tests
pnpm build      # type-check and production build
```

The browser tests are configured for the Microsoft Edge channel (`msedge`). Install Edge if it is missing, or change the Playwright channel configuration to use a browser installed on your machine.

## Local data and catalog

Open a matched show's detail and select **Delete show** to remove it, then confirm. Removal covers metadata, viewing history, personal notes/order and linked source entries, and stays removed after reload. Original source files and previously exported backups remain unchanged. A fresh explicit import can add the show again with no old progress.

The library is stored in IndexedDB for the browser and origin you use. Data in `127.0.0.1:5173` is separate from data on another host, port, browser, or deployed site. The app can export a JSON backup; restore is not implemented.

The normalized working catalog contains **301 installments across 208 titles**. It excludes all **5 Silo entries**; Silo remains in the preserved original master list and is intentionally not seeded. Catalog entries begin as source rows awaiting a positive, per-title TVmaze match, so the matched library may initially be empty. `Re S3` and `Re S4` remain flagged for manual identification. Source schedule and renewal claims are unverified until checked.

Keep `originals/Project Watchlist Master List.txt` unchanged. Use the normalized working copy at `public/master-working.json` for the app.

## Scope of this version

The UI is a functional placeholder; Claude owns the visual design. Installable/offline PWA behavior, backup restore, recommendations, and drag-and-drop reordering are deferred. The Silo mid-season onboarding test is intentionally pending; no Silo data is seeded.
