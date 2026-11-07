# Watchlist visual design handoff for Claude

Updated: 2026-11-06. This handoff is ready for visual work while synchronization implementation continues.

## Product and audience

Watchlist is a personal TV viewing tracker for one user on Windows PC and Android. It should be easy to launch from an app/taskbar/home-screen icon and feel comfortable on both devices. Firefox is the primary browser target. The current visual style is intentionally plain placeholder boxes.

The working app is at https://genre-watchlist.firebaseapp.com/ . Google sign-in is restricted to the owner's account. The hosted library may be empty; the original local viewing library has not been migrated. Use fictional sample data in mockups and do not require the user to upload personal history.

## Work Claude can start now

Create a visual direction, responsive screen mockups and a reusable component/style specification. Include normal, empty, loading, offline, syncing, conflict and error states. Show a Windows layout and a narrow Android layout, plus a compact interaction guide for cards and dialogs. Design an app icon to replace the temporary W icon.

A separate design branch or standalone mockups will keep this work independent of the active synchronization changes. Coordinate before integrating changes into the shared working folder. Current local project files are more recent than the last GitHub upload.

## Required navigation and screens

- Weekly: shows grouped Monday through Sunday when an active season has released and upcoming episodes.
- Binge: available backlog and other non-weekly shows with a persistent manual order.
- Watched: viewing history, including completed seasons and titles.
- Add Show: editable TVmaze search, explicit candidate choice, ambiguity handling and current-episode onboarding.
- Import: source entries and explicit matching; uncertain metadata remains visibly uncertain.
- Show detail: episode checkboxes, personal notes, current-episode selection/catch-up, refresh metadata, back navigation and Delete show.
- Backup export and restore: keep these together at the top right on PC; use a clear, reachable arrangement on mobile. Restore includes counts, replacement confirmation and the opportunity to export first.
- Account/install/offline/update/sync status: concise, visible and understandable without technical terms. Installation and synchronization are separate concepts.

## Card behavior already agreed

Binge cards will be draggable with mouse and touch. Up/down reorder arrows belong on the RIGHT EDGE, VERTICALLY CENTERED on the card. Both controls update the same saved manual order. Provide accessible keyboard alternatives and visible feedback during dragging. Keep episode checkboxes and detail links easy to tap without accidentally dragging.

Cards should make the title, service, next available unwatched episode and backlog clear. Checking an episode advances to the next available unwatched episode; undo returns correctly. Actual episode availability controls the queue. A future season must not move a completed backlog season into Weekly before that new season starts releasing.

Silo was excluded from the original bulk seed and added manually for onboarding testing. Do not add it to the starting import or reset its viewing state as part of design work.

## States and interactions to design

Saved notes and viewing progress must remain clear when offline. Design distinct messages for syncing, up to date, offline changes waiting, a failed connection and a conflict requiring a choice. A conflict should explain the consequences of choosing one library and make backup export easy to find.

A full-library restore or show deletion needs a clear confirmation of scope. Normal updates should offer Update and reload without interrupting ongoing work. Avoid presenting speculative future release/renewal information as confirmed.

Plan an eventual completion prompt that recommends another show from the user's Binge list, with Watch Now, Watch Soon, Skip, Pass and dismiss actions. That feature is pending; label it as a proposed design rather than implemented behavior.

The external spelling/alias search idea is also a future feature: search TVmaze under another spelling, then explicitly confirm the selected series. Existing editable search is already available.

## Visual and accessibility goals

Use a clear hierarchy, readable text, comfortable touch targets and restrained status colors. Make the Android layout feel intentional rather than a squeezed desktop table. Include contrast, keyboard focus, dialog focus, reduced motion and non-color-only indicators. Keep the UI free of database names, provider configuration and engineering details.

The user has not chosen a visual theme, color palette, typography or light/dark preference. Offer two distinct visual directions using the same screen and sample content, then develop the chosen direction. These are visual options, not new product features.

## Implementation boundaries

Keep progress, metadata, ordering, import rules, authentication, database schema and synchronization behavior intact. ChatGPT is implementing those functions and tests. Preserve useful accessible names/labels when styling so existing behavior and accessibility checks continue to work.

Useful current files in D:\Watchlist: src/App.tsx, src/style.css, src/CloudBootstrap.tsx, src/PwaStatus.tsx, src/BackupExport.tsx and src/BackupRestore.tsx. Read Notes/DECISIONS.md, Notes/ROADMAP.md and this handoff for current requirements. Synchronization components are being integrated separately and their visual states can be designed now.

## Suggested delivery

1. Two visual directions for the same Binge screen.
2. Selected direction across Weekly, Binge, Watched and show details at PC and Android widths.
3. Card, reorder, navigation, episode, note, dialog and status component specifications.
4. Icon/assets and clear styling guidance or an isolated presentation-only change set ready for integration.

No paid hosting, assets or services should be introduced without the user's explicit choice. Keep the first delivery focused on visuals and interaction presentation.
