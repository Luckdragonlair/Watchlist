# Watchlist shared library and migration

## One shared address

Use https://genre-watchlist.firebaseapp.com/ consistently on PC and Android, signed into the same Google account. The hosted version keeps a private local copy on each device and synchronizes saved changes while the app is open and connected. New device sign-in needs internet. Offline tracking continues from the saved local copy; reconnect or reopen online to send changes.

The original http://127.0.0.1:5174 library is still independent. Enabling sync does not silently upload or replace it. Keep it and a fresh backup until migration and both-device acceptance pass.

## Transfer the existing library once

1. Open the original local Watchlist in the browser that contains the current shows. Export a fresh backup using the top-right control. An older backup may omit later viewing changes.
2. Open the hosted address on the PC, sign in and accept Update and reload if offered. Wait for its sync status.
3. Choose Restore backup and select that fresh file. Review counts, export the hosted copy first if it contains anything worth keeping, and confirm replacement. The dialog explains that replacement also synchronizes to other signed-in devices.
4. Wait for Up to date across your signed-in devices.
5. Open the same hosted address on Android, sign in, accept any update, and compare show counts, the next episodes, notes and order.
6. Verify a small notes edit in each direction and remove that test text afterward. Check actual episode progress as you watch; the automated tests already exercise check-off and undo using disposable records.
7. Install the hosted address using Firefox's web-app/taskbar control on PC and menu > Install on Android. Existing local shortcuts still open the old local address.

Keep the original local library until these checks pass. Existing backup files and preserved master files are not changed by migration.

## Conflicts and offline changes

Independent saved edits merge where possible. Different edits to the same notes, episode state or manual ordering can pause sync for review. A show deleted on one device cannot silently reappear through older offline edits; explicit re-adds have a new identity.

If sync pauses, export the device's current library first. The choice buttons explicitly use either this device's entire library everywhere or the shared library on this device. The confirmation explains which complete copy is replaced. Cancel leaves both copies intact.

Full backup replacement starts a new shared generation. Edits waiting from an older generation are reviewed rather than automatically written over the replacement.

Changes made while an upload is pending are rebased after acknowledgement, including a quick undo. Upload intent is persisted before network writes. A restart or lost reply can recover a proven upload; ambiguous later server changes pause safely with local data retained.

Saved notes from another device update an untouched notes field. An unsaved draft stays visible; overwriting newer saved notes requires an explicit choice. Save drafts before closing the app.

## Privacy and free service limits

Access is restricted by deployed Firestore rules to the configured owner's Google UID. The app and installation files are public; the personal master seed is excluded. The shared library is stored privately in Firestore, and cached local data remains on the signed-in device.

The project stays on the free Spark plan with billing disabled. Sync uses Firestore and classic Hosting only. If a free service quota is reached, service can stop until the quota resets; the app must not enable billing automatically.

This sync version supports snapshots up to 6 MB, split into at most eight bounded UTF-8 chunks. Oversized libraries remain local and exportable. Snapshot data fields are exempted from unnecessary indexing. Shared backup/progress data is not cached by the service worker; Firebase's reserved /__/ authentication pages must always bypass offline routing.

## Implementation and verification

The durable saved local library, last acknowledged shared snapshot, and pending upload intent act as the synchronization queue. Three-way merge compares the acknowledged baseline, current local records and latest cloud records. Existing mutation paths remain transactional; show deletion/re-add lifecycle markers and restore generation changes are stored in the same database transactions as those actions.

Cloud writes use an atomic compare-and-swap revision and hashed chunks. Rules require all declared chunks in the same commit, reject malformed/reused revisions and deny other users. Reads fetch server-confirmed data, verify the checksum, and recheck the manifest to avoid mixed revisions.

Run pnpm test for local merge/queue/database tests, pnpm test:e2e for browser behavior, pnpm test:pwa for offline/update routing, pnpm test:hosted for unsigned-in hosted privacy, and pnpm test:rules for both rules and real SDK/two-database tests against the local demo emulator. On a fresh Windows checkout run powershell -File scripts/setup-rules-java.ps1 first if usable Java is unavailable. Tests refuse a non-loopback emulator and use demo-watchlist-rules, never the user's live library.

Actual Android/Firefox installation, signed-in offline behavior and personal-library migration require real-device acceptance in addition to automated checks. See Notes/PROGRESS.md for current deployment status and verified results.
