# Potential Watchlist upgrades

Updated: 2026-11-08 12:19 America/Chicago
Status: **Optional brainstorming only. Not selected, scheduled or authorized for implementation.**

These 15 ideas add possibilities beyond the original 42-item FEATURE_PLAN.md inventory. They do not increase the current core estimate. Time ranges are best-effort active development estimates based on the present app, including focused checks and notes once prerequisites are available. Account/device waiting time and major scope expansion are excluded. Shared preference/backup work should be batched rather than charged repeatedly for several small options.

## Quick comparison

| ID | Potential upgrade | Difficulty | Estimated active effort |
|---|---|---|---|
| U01 | Why is this here? | Easy | 1–2 hours |
| U02 | Spoiler shield | Easy–moderate | 1–3 hours |
| U03 | Favorite stars | Easy | 1–2 hours |
| U04 | Quick finishes | Easy | 1–2 hours |
| U05 | Desktop keyboard shortcuts | Easy–moderate | 1–2 hours |
| U06 | Seasonal Nightfall decorations | Easy–moderate | 1–3 hours |
| U07 | Compact versus detailed card mode | Moderate | 1.5–3 hours |
| U08 | What fits my available time? | Moderate | 2–4 hours |
| U09 | Personal reactions | Moderate | 2–4 hours |
| U10 | Snooze a title | Moderate | 2–4 hours |
| U11 | Personal collections | Moderate | 3–5 hours |
| U12 | Tonight’s watch tray | Moderate | 3–5 hours |
| U13 | Recent-actions undo panel | High | 3–6 hours |
| U14 | Viewing journal and simple statistics | High | 4–7 hours |
| U15 | Rewatch mode | High | 6–10 hours |

## Ideas, prerequisites and scope

### U01 — Why is this here?

A small explanation of Weekly/Binge/Upcoming placement—for example, an active new season can put a show in Weekly even when older episodes are unwatched.

- **Effort:** Easy, approximately 1–2 active hours.
- **Needs first:** Existing placement helpers; independent of movies.
- **Scope guard:** Use the actual saved release rules and unknown states. No AI explanation service is needed.

### U02 — Spoiler shield

Hide unwatched episode names and descriptions, retaining season/episode numbers; reveal them once watched or on an explicit request.

- **Effort:** Easy–moderate, approximately 1–3 active hours.
- **Needs first:** Current episode cards; coordinate with the proposed on-card picker.
- **Scope guard:** Hidden text must also be excluded from screen-reader output. This does not generate spoiler-free recaps.

### U03 — Favorite stars

Star particular titles and offer a Favorites filter, without disrupting started-first placement or manual order.

- **Effort:** Easy, approximately 1–2 active hours.
- **Needs first:** Shared personal-preference/backup support; batch with C10 or a later compatible preference update.
- **Scope guard:** Favorite is separate from watched, section choice and Not for me. Include offline/sync preservation.

### U04 — Quick finishes

A shortcut for titles with only a few known episodes left, helping choose something satisfying to finish.

- **Effort:** Easy, approximately 1–2 active hours.
- **Needs first:** Existing episode counts/availability; runtime support only if time-based versions are added.
- **Scope guard:** Say exactly what remains known or available; never claim an entire series is nearly finished when future episodes/seasons are unknown.

### U05 — Desktop keyboard shortcuts

Optional shortcuts such as / to search, J/K to move between cards and Enter to open a title.

- **Effort:** Easy–moderate, approximately 1–2 active hours.
- **Needs first:** Stable card layout; independent of movies, reusable later.
- **Scope guard:** Show a small shortcut help panel and ignore shortcuts while typing in notes/search. Avoid destructive or accidental watched-state shortcuts.

### U06 — Seasonal Nightfall decorations

Optional Halloween or winter touches around the existing Nightfall background/banner for a little personality.

- **Effort:** Easy–moderate, approximately 1–3 active hours.
- **Needs first:** Finish the approved palette first (C03).
- **Scope guard:** Keep genre colors, readable contrast and the approved splash intact. Initial scope is restrained CSS/vector decoration, not generated media or complex animation.

### U07 — Compact versus detailed card mode

Choose a denser list on PC or extra-compact phone cards, expanding supporting details only when wanted.

- **Effort:** Moderate, approximately 1.5–3 active hours.
- **Needs first:** Card layout/picker decisions C05–C06; reuse for movie cards C12.
- **Scope guard:** Keep title, next action, accessible controls and required provider/status text readable. Store density per device so phone and PC can differ.

### U08 — What fits my available time?

Choose a time budget such as 25, 45 or 90 minutes and find eligible episodes or movies that fit.

- **Effort:** Moderate, approximately 2–4 active hours.
- **Needs first:** Cache runtime data; C09/C12 for mixed TV/movie results.
- **Scope guard:** Import TV runtime data as well as movie runtime. Unknown runtimes remain unknown, with an explicit include/exclude choice. A deterministic filter needs no AI credits.

### U09 — Personal reactions

Record Loved it, Liked it or Meh, giving the app explicit taste signals instead of assuming watched means enjoyed.

- **Effort:** Moderate, approximately 2–4 active hours.
- **Needs first:** Personal preference storage/compatibility (C10); useful input for later A03 recommendations.
- **Scope guard:** Keep reactions separate from Not for me and interest state. Ratings alone do not send personal data to an AI service.

### U10 — Snooze a title

Temporarily tuck a show or movie away until next week or a chosen date, without marking it watched or Not for me.

- **Effort:** Moderate, approximately 2–4 active hours.
- **Needs first:** Shared preferences/compatibility C10; use Central-time date handling.
- **Scope guard:** Return it when the app next opens/becomes visible after the date. Metadata can stay tracked; this does not promise a closed-app notification.

### U11 — Personal collections

Build private collections such as Halloween, Weird Westerns or Something light, with a title allowed in several collections.

- **Effort:** Moderate, approximately 3–5 active hours.
- **Needs first:** Provider-safe shared identities C09 and persistence C10.
- **Scope guard:** Collections are curated title sets, distinct from genre filters and a single evening queue. Family sharing is a separate later feature.

### U12 — Tonight’s watch tray

Pick a short lineup of episodes and movies for one evening without changing the permanent Binge order.

- **Effort:** Moderate, approximately 3–5 active hours.
- **Needs first:** Movie-aware identities/storage C09–C10 and cards C12 for a mixed tray.
- **Scope guard:** Treat it as a separate session queue. Watching an item uses existing progress actions; skip/cancel does not mark it watched.

### U13 — Recent-actions undo panel

Review and undo several recent check-offs or ordering moves rather than relying only on the last-action Undo button.

- **Effort:** High, approximately 3–6 active hours.
- **Needs first:** Movie-aware action/storage compatibility C10.
- **Scope guard:** Initial scope excludes deleting/restoring whole libraries. Reject stale undo after another device changes the same records; keep this separate from C16 recovery snapshots.

### U14 — Viewing journal and simple statistics

See recorded activity, completed titles and personal genre patterns, with optional dated viewing entries.

- **Effort:** High, approximately 4–7 active hours.
- **Needs first:** History/provenance support plus C09–C10; runtime data for any estimated duration totals.
- **Scope guard:** Existing import/onboarding timestamps are not historical watch dates. Keep those distinct, label legacy dates unknown and label runtime totals as estimates. Provenance work is included in this range.

### U15 — Rewatch mode

Start another viewing of a season, series or movie while retaining the original completed history.

- **Effort:** High, approximately 6–10 active hours.
- **Needs first:** Stable movie-aware progress, backup/sync and deletion safeguards C09–C10.
- **Scope guard:** Requires separate watch sessions/cycles rather than clearing first-viewing records. Include undo, correct current-session queues and cross-device preservation.

## Suggested shortlist

- **Fast practical wins:** U01 placement explanations, U02 spoiler shield and U03 favorites. U03 is cheapest when preference/schema work is already being updated.
- **Best companions for movies:** U08 time-budget filtering and U12 Tonight’s watch tray.
- **Fun low-risk option:** U06 optional seasonal decoration after the approved palette is finished.
- **Useful later taste input:** U09 reactions and U11 private collections. Neither requires an AI feature.
- **Leave until the data model is settled:** U13 multi-action undo, U14 viewing journal and U15 rewatches. Protecting real history matters more than a quick UI prototype.

The list does not duplicate genre checkboxes, movie support, AI recommendations or family sharing already tracked in FEATURE_PLAN.md. None of these ideas by itself requires AI calls; any later AI integration remains a separate opt-in decision.
