# Install and use Watchlist offline

Current release: v0.9.0 with format-4 primary-genre preservation. Update and reload both devices. Existing owner migration and core PC/phone notes/offline reconnect passed by earlier user report; actual Firefox/Android accessibility and remaining acceptance checks are separate. See Notes/HANDOFF_QUORA.md.

## Hosted trial on PC and Android

Open [Genre Watchlist](https://genre-watchlist.firebaseapp.com/) in Firefox and sign in with the same Google account used during setup. The app is now published on Firebase Hosting and can load with the PC switched off. The project has billing disabled. Only the configured owner can open the hosted library through the app.

The hosted version now automatically synchronizes the private signed-in library. For an unmigrated setup its first library may be empty; the current owner completed migration earlier. Use a fresh backup for the one-time transfer described in [SYNC.md](SYNC.md). Signing in on another hosted device then brings down the shared copy; signing in does not silently upload the old local origin.

On Android, open the hosted address in Firefox, then menu > Install to add the home-screen icon when offered. Wait for Available offline before trying an offline reopen. On Windows, use the Firefox address-bar web apps button. The existing PC shortcut for 127.0.0.1 still points to the original local app.

Verified in an isolated Edge browser: live sign-in screen, manifest, offline reopening of the unsigned-in shell, and no exposed personal master catalog. The owner subsequently reported successful hosted sign-in, two-device live notes and offline notes delivery on reconnect; remaining formal device acceptance is tracked in Notes/SYNC_ACCEPTANCE_2026-11-07.md.
## Start the original local app

Use the production app for your regular watch history:

```powershell
pnpm build
pnpm start
```

The supplied `run-watchlist.ps1` launcher also builds and serves the app at `http://127.0.0.1:5174`. Open that address in Firefox, Edge or Chrome. The first visit and each app update need the local launcher/server running. Internet access is needed for TVmaze, not for the local app files. After the first load, wait for **Available offline** before closing the app.

The app's service worker saves the app shell and starter catalog for offline use. Once cached, you can reopen the app, view details, check episodes, change ordering, and export or restore a backup while the server is stopped. TVmaze search, matching/importing new show metadata, and refreshing metadata need internet access. Reading a working-list file is local.

## Install it in your browser

In Firefox on Windows, use the web apps button in the address bar to add Watchlist to the taskbar and Start menu. This PC has Firefox 159.0.1 installed; the user has confirmed Watchlist loads and taskbar setup works. The user also confirmed reopening from the taskbar with internet disconnected; reopening with the local launcher stopped remains unverified in Firefox. On Android, Firefox offers menu > Install > Add to Home Screen. Use https://genre-watchlist.firebaseapp.com/ on the phone; 127.0.0.1 on a phone refers to the phone, not the PC.

In Edge or Chrome, use the app's **Install app** button or the browser's **Install** option when offered. If you opened the address in an in-app browser and only see **How to install**, open the same address in your normal browser and use its installation controls.

Installable support and offline caching are implemented. Browser checks verify reopening with the server stopped, accepting an online update while keeping viewing history, and retaining the offline app when an update fails. A full browser-restart check with the server stopped also passes. The user confirmed Firefox loading and taskbar web-app setup on the PC on 2026-11-06. The user also confirmed Firefox reopening from the taskbar with internet disconnected. Firefox reopening with the local launcher stopped and Android installation remain unverified. A separate hosted trial is now published; automatic phone/PC synchronization is deployed, with personal migration and actual-device acceptance still to complete. The current app icon is a placeholder until Claude's visual design is added.

## Keep your library safe

Each browser and address keeps a separate local library. The normal app uses `http://127.0.0.1:5174`; development uses a separate library at `http://127.0.0.1:5175` and has no service worker. Avoid the development address for your regular saved data. Use **Export backup** and **Restore backup** to transfer data between browsers or addresses, and keep a backup somewhere safe: clearing browser data can erase the local library.

When an update is ready, the app shows **Update and reload**. Choose it when convenient; save any open notes first. It does not force a reload while you are using the app. You can accept the update immediately; otherwise a waiting update can activate after all app windows are closed.

## Firefox verification checklist

- [x] Confirm PC Firefox version: 159.0.1, inspected 2026-11-06.
- [ ] Export a backup from the browser containing the current library.
- [x] Open Watchlist in Firefox: user reported it loaded successfully on 2026-11-06.
- [x] Available offline / internet-disconnected taskbar reopening flow: user reported success on 2026-11-06.
- [x] Set up Firefox taskbar web app: user reported it worked on 2026-11-06.
- [x] Close Watchlist and reopen from the taskbar with internet disconnected: user reported success on 2026-11-06.
- [ ] Verify offline reopening with the launcher stopped, then resume the launcher. Do not change personal viewing state just to test.
- [ ] On the hosted trial address, verify Google sign-in, installation and offline reopening on actual Android Firefox.

Sources checked 2026-11-06: [Mozilla Windows web apps](https://support.mozilla.org/en-US/kb/web-apps-firefox-windows), [Mozilla Android web apps](https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android).

## Automatic metadata checks - 2026-11-08

While open, visible and connected, Watchlist refreshes linked shows whose metadata is at least 24 hours old. Overdue checks resume on reopening or reconnection. Checks pause offline, during setup/restore/manual work, and during unresolved synchronization conflicts. Tracking and cached episode availability still work offline. Closing/suspending the app stops scheduled checks; no server background job or paid service is installed. TVmaze Ended shows stay included because cancellation is not independently established. Notes, watched history and manual ordering survive checks; failures keep the last saved snapshot.

## Binge sections offline (v0.5.0)

Section choices and arrow order are stored locally, work offline, and sync on reconnection. Not for me hides active placement without deleting history. Match keeps the saved unmatched queue available offline, but TVmaze search/linking requires internet. New backups are format 2 with sections; old format 1 is still accepted. Update PC and phone to v0.5.0 or later before shared use; older apps cannot read the new payload. No database reset or automatic restore is performed.

## Splash and banner offline (v0.6.0)

The original five-second Brick alley splash and gold banner use cached local Limelight/brick/runtime assets, with no external media/font requests. They replay on page launch/reload, including offline reopen; in-app navigation does not replay. Reduced motion shortens the static/fade path; forced colours omits the splash. Failed runtime/font startup has independent cleanup. Android manifest/startup background and browser theme are #05070d. Weekly opens first, using today-first Central-time weekday order. Existing databases and format-2 backups are unchanged.

## Offline card ordering (v0.7.0)

Dragging, arrows, activity grouping and Recent reset operate on IndexedDB offline and sync when reconnected. Drag handles reserve touch gestures; ordinary card surfaces still scroll. Both devices must update for format-3 snapshots, which preserve the manual-activity override. Legacy formats remain readable. No new cloud job, external provider or paid service is introduced.

## v0.11.1 app icons

Approved metallic-gold Nightfall icons use new filenames and are cached with the shell, including favicons and the full-bleed maskable asset. Update and reload to receive the new manifest/icons. Offline asset availability is independently tested; existing OS launcher/pinned shortcut icon refresh remains a device acceptance check. No installation/library reset is required by this code change.

## Firefox Windows keeps an old taskbar icon

Firefox web apps retain a separate icon file under their profile taskbartabs/icons folder; updating the website or unpinning alone may leave that saved icon unchanged. On 2026-11-08, Watchlist’s two shortcuts correctly targeted the hosted app but referenced the old white-W ICO. The agent backed up and replaced only that ICO with approved gold frames and notified Windows to refresh. Reopening the Watchlist app window is the next user check; visible taskbar success is not yet confirmed. Do not delete browser data or all web-app registrations to troubleshoot one icon. Repair originals/receipts are private in originals/firefox-icon-repair-*/. See Mozilla’s Firefox Web Apps Architecture documentation for saved-icon behavior.
