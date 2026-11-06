# Install and use Watchlist offline

## Start the normal app

Use the production app for your regular watch history:

```powershell
pnpm build
pnpm start
```

The supplied `run-watchlist.ps1` launcher also builds and serves the app at `http://127.0.0.1:5174`. Open that address in Edge or Chrome. The first visit and each app update need the local launcher/server running. Internet access is needed for TVmaze, not for the local app files. After the first load, wait for **Available offline** before closing the app.

The app's service worker saves the app shell and starter catalog for offline use. Once cached, you can reopen the app, view details, check episodes, change ordering, and export or restore a backup while the server is stopped. TVmaze search, matching/importing new show metadata, and refreshing metadata need internet access. Reading a working-list file is local.

## Install it in your browser

In Edge or Chrome, use the app's **Install app** button or the browser's **Install** option when offered. If you opened the address in an in-app browser and only see **How to install**, open the same address in Edge or Chrome and install it there.

Installable support and offline caching are implemented. Browser checks verify reopening with the server stopped, accepting an online update while keeping viewing history, and retaining the offline app when an update fails. A full browser-restart check with the server stopped also passes. The app has not yet been installed on your specific computer or phone. No public hosting or phone sync has been set up. The current app icon is a placeholder until Claude's visual design is added.

## Keep your library safe

Each browser and address keeps a separate local library. The normal app uses `http://127.0.0.1:5174`; development uses a separate library at `http://127.0.0.1:5175` and has no service worker. Avoid the development address for your regular saved data. Use **Export backup** and **Restore backup** to transfer data between browsers or addresses, and keep a backup somewhere safe: clearing browser data can erase the local library.

When an update is ready, the app shows **Update and reload**. Choose it when convenient; save any open notes first. It does not force a reload while you are using the app. You can accept the update immediately; otherwise a waiting update can activate after all app windows are closed.
