# Watchlist hosting and synchronization proposal

Updated: 2026-11-06 07:02 CST (America/Chicago)

Status: User selected Firebase Spark and Google sign-in, strictly free, on 2026-11-06. User created Genre-Watchlist (project ID genre-watchlist) and supplied the web configuration. Hosting and automatic cloud synchronization are now deployed. This file records the initial proposal; current implementation and migration instructions are in ../SYNC.md, and verification is in PROGRESS.md.

## Recommended setup

Use Google Firebase Hosting for the app, Firebase Authentication for sign-in, and Cloud Firestore for the private shared library. Keep the current IndexedDB library and offline app shell. This combines hosting, sign-in and data storage under one service rather than requiring multiple hosting accounts.

Start with the no-cost Spark plan and ordinary Firebase Hosting, not the separate Firebase App Hosting product. Spark requires no payment method. Current free Firestore limits include 1 GiB stored data, 50,000 reads and 20,000 writes per day. Hosting includes 10 GB stored content and 10 GB monthly transfer. A personal text-focused watchlist is expected to fit, but actual sync traffic must be measured. Exceeding no-cost limits can interrupt service; free service is not a paid uptime guarantee. Paid services and billing upgrades are outside this proposal.

Propose Google sign-in using the same account on both devices. The user confirmed this preference on 2026-11-06. Access rules must restrict data to the intended owner; being signed in alone is insufficient. Firebase stores a server-side copy of the library; local offline copies and exported backups remain available.

Sources checked 2026-11-06: [Firebase plans](https://firebase.google.com/pricing), [Firestore limits](https://firebase.google.com/docs/firestore/quotas), [Hosting limits](https://firebase.google.com/docs/hosting/usage-quotas-pricing), [Security rules](https://firebase.google.com/docs/firestore/security/get-started).

## Implementation sequence

1. Prepare and test locally: hosted configuration, sign-in, owner-only rules, private data migration and sync adapter. Test access denial with the local emulator before exposing personal data.
2. User creates a Firebase project on Spark under their own Google account. Account sign-in stays under user control. Disable optional analytics unless wanted.
3. Before deployment, remove the personal master catalog from public assets and service-worker precache. New hosted installs start empty until authenticated data or a deliberate backup import is available. Preserve the original source files.
4. Publish the prepared app at its supplied HTTPS address. This makes phone access independent of the PC being on.
5. Export a fresh backup from the current library. Preview an explicit one-time migration into the signed-in hosted library; do not silently replace either library. Install the hosted address on PC and phone.
6. Complete and verify synchronization: check-off and undo, notes, deletion, ordering, offline reconnect, conflicting edits, library replacement and recovery on a replacement device.

Hosted access and automatic sync are separate checkpoints. A database SDK does not automatically synchronize the existing IndexedDB records.

## Required synchronization design

Implemented approach: keep the durable current library, acknowledged baseline and pending upload intent in IndexedDB; show pending or failed synchronization. Stable upload intents prevent duplicate or lost acknowledgement handling. The original per-mutation event outbox proposal was replaced by this state-based design. Merge independent edits; define explicit conflict behavior for same-episode edits, notes and ordering before implementation. Retain deletion markers so an older offline device cannot resurrect removed shows. A full restore needs a library generation boundary so pre-restore pending edits cannot overwrite the replacement library.

Do not rely on background execution while the app is closed. Synchronize when open and connected, and on reopening/reconnect. Keep TVmaze metadata separate from personal viewing state. Define sign-out behavior so private cached data is not accidentally shown to another account.

## Remaining decisions and estimates

- [x] Firebase Spark and Google sign-in selected by the user, conditional on remaining free. No payment method or billing upgrade.
- Finalize conflict, restore and account-recovery behavior before sync coding.
- Keep initial scope TV-focused unless the user changes it.
- Architecture/access work: approximately 1–2 focused sessions remaining. Hosting setup: 1–3 sessions. Robust two-device synchronization: 4–8 sessions, with estimates revised as implementation proceeds.

A focused session is roughly 1–2 active hours. Android acceptance follows hosted access; PC Firefox loading, taskbar setup and internet-disconnected reopening have passed by user report. Firefox local-server-stopped reopening remains a separate open check.
