# Free Firebase setup for Watchlist

## Current checkpoint

The user selected Firebase Spark and Google sign-in, conditional on staying free. Project ID: `genre-watchlist`; display name: Genre-Watchlist. The supplied web configuration is stored in ignored `.env.hosted.local`. The hosted app is published at https://genre-watchlist.firebaseapp.com/ (also https://genre-watchlist.web.app/). Billing was verified disabled before deployment. Automatic synchronization is now deployed. The shared library is created when the owner opens the updated app. The original local library still needs deliberate migration.

Implemented: hosted Google sign-in, separate owner-bound local databases, private seed exclusion, strict owner-only snapshot rules, durable upload intent/recovery, three-way merge and explicit conflict choices. The shared snapshot transport is connected in the hosted app. The older pure operation-protocol model remains a design reference; the running implementation uses state-based baselines and persisted pending uploads. See SYNC.md.

Keep the project on Spark; do not enable billing or switch to Blaze. Use **Firebase Hosting**, not Firebase App Hosting. Do not enable Cloud Functions or Cloud Storage for this plan. The SDK dependency does not create or bill for those products merely because they exist in the package. Gemini in Firebase is optional and currently free; it is not needed for Watchlist.

## Google sign-in setup

1. Firebase console > Authentication > Get started > Sign-in method > Google. Enable Google, choose the support email, and save.
2. Authentication > Settings > Authorized domains: add `localhost` for the isolated local setup screen if missing. The deployed default Firebase domain must also be authorized.
3. Run the separately prepared hosted setup build at `http://localhost:5182`. This is not the normal `127.0.0.1:5174` library. The coding assistant will start this preview when ready.
4. Sign in yourself. With the owner UID blank, the setup screen shows the signed-in account ID but opens no library. Confirm that this is the intended Google account, then provide that UID for owner setup. Passwords and sign-in codes stay with the user.
5. Set `VITE_FIREBASE_OWNER_UID` and the rule owner identity, rebuild, and close all old setup windows before reopening. The update control is available even on the setup screen.

## Build and deployment boundary

Normal app: `pnpm build` and `pnpm start`. These preserve the existing local origin and database. They do not initialize Firebase.

Hosted preparation: `pnpm build:hosted`. It requires complete Firebase web configuration; an empty owner UID is allowed only for the locked owner-setup screen. Output is `dist-hosted`, not `dist`. Public assets are copied using an explicit icon/manifest allowlist; the personal master catalog is omitted. The app does not fetch the initial master in hosted mode. A predeployment guard rejects the ordinary local build, personal catalog files and master precaching. Do not publish the ordinary `dist` folder.

The published trial uses classic Firebase Hosting. Before each update, rebuild and check the hosted assets, then deploy only the intended target with project genre-watchlist explicitly set. The Firebase CLI is installed and authorized for this project. Hosting, owner-only sync rules and data index exemptions were deployed on 2026-11-06 after the full test suite passed. The original local library was not uploaded. No generated credentials or admin keys belong in the client or Git.

## Data and security

The existing local library remains `watchlist-v01` at its existing browser/address. Hosted authenticated libraries use a different database named for the owner UID, on the hosted origin. Signing in does not upload or replace the original local library. The hosted-origin library synchronizes after owner sign-in. Migration requires a fresh export and deliberate restore into the authenticated library, followed by a separately verified initial cloud import.

Deployed Firestore rules allow only the configured owner to access the exact sync manifest/chunk paths. Revision, shape, timestamp, size and complete atomic chunk checks are enforced. Other users, anonymous clients and unmatched paths are denied. Personal library snapshots are capped at 6 MB across eight chunks. Data field indexing is disabled. Google sign-in alone is not database authorization.

System Java is a broken registry shim. A verified portable Temurin 21 runtime in ignored .tools/java21 now runs the Firestore emulator without changing system Java. Run pnpm test:rules; on a fresh checkout first run powershell -File scripts/setup-rules-java.ps1. The runner targets demo-watchlist-rules and loopback only; tests load the rule source explicitly. Thirteen security-rule tests and five real SDK/two-database integration tests pass for the deployed shared-data implementation. The runner also executes the SDK suite after the rules files, serially against the local demo project.

The earlier pure operation protocol is retained as a design reference. The deployed state-based engine persists the last acknowledged baseline and upload intent in the same IndexedDB library. It merges current local changes against the server snapshot, uses atomic revision checks and recovers interrupted acknowledgements. Conflicts are visible and require an explicit complete-library choice. This avoids depending on an in-memory queue or missing a direct table mutation.

## Current official references

Checked 2026-11-06: [Spark pricing](https://firebase.google.com/pricing), [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Hosting setup](https://firebase.google.com/docs/hosting/quickstart), [Firestore authorization](https://firebase.google.com/docs/firestore/security/rules-conditions), [Gemini pricing](https://firebase.google.com/docs/ai-assistance/gemini-in-firebase#pricing).

## Firebase Dynamic Links warning — 2026-11-06 07:29 CST

Checked the console warning against Google documentation: https://firebase.google.com/support/dynamic-links-faq . Current Watchlist uses Firebase JavaScript Google sign-in in a web app/PWA (same-window redirect on the matching hosted domain, popup for local setup), not Dynamic Links, native email-link authentication or Cordova OAuth. No migration is required for the current flow. Recheck if future native packaging or email-link features are introduced. Actual Firefox/Android sign-in acceptance remains open; the shutdown notice does not establish a device test result.

## Hosted sign-in recovery

The primary firebaseapp.com address now uses same-window Google sign-in to avoid popup-only failures. Refresh, wait for Update and reload if offered, accept it, then retry. Open the hosted address directly in Firefox if an embedded browser prevents Google login. A completed hosted login still needs target-device acceptance; the automated live navigation check stops before entering credentials.

The offline service worker must always bypass Firebase Hosting reserved /__/ paths, including /__/auth/iframe and /__/auth/handler. Returning the app shell for these navigations breaks sign-in after the worker starts controlling the page. This was reproduced and fixed on 2026-11-06; verify sign-in with a warm cache, not just first visit. The five-test PWA suite now includes both iframe and top-level helper navigation.
