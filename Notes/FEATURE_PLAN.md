# Watchlist proposed feature and dependency plan

Updated: 2026-11-08 13:58 CST (America/Chicago)

Current continuation: HANDOFF_QUORA.md. C02 TV/C03-C06 are delivered; v0.8.1 adds compact cards and v0.9.0 adds reviewed primary preferences (181 applied, format 4). Primary-genre match/setup and existing-show editor remain unbuilt. The estimates below are historical planning ranges, not a current remaining-work total.

This is a planning inventory of 42 proposed changes and remaining acceptance items. It does not authorize implementation. The owner subsequently authorized and completed the TV genre foundation, colors, checkboxes and card controls (C02 TV portion, C03-C06) in v0.8.0. Family access remains deferred; AI-credit use is undecided. The order below respects dependencies while putting small independent wins early. Difficulty is relative to the existing app, not a claim about product importance.

Estimates are rough active implementation/review time, including focused verification, notes and an ordinary checkpoint. They exclude account approvals, waiting for user/device access, unavailable metadata and long external review queues. Final integrated verification is listed separately. Use focused checks during fixes, then a broader pass at a coherent milestone; do not rerun the full suite for every small change.

Historical baseline before v0.8.0 completed C02 TV/C03-C06: the core TV/movie route totaled **30.5–63 active hours** before contingency; a 20% allowance gives roughly **37–76 hours**. These historical totals are not current remaining work; re-estimate the remainder before scheduling. They are planning ranges, not calendar promises. At two active hours per session, the base range is roughly 16–32 sessions. The older TV-only roadmap total is superseded by this expanded scope. Optional extras and later tracks are excluded.

## Recommended core order

Completed checkpoint: C02 TV presentation/filter foundation and C03-C06 delivered v0.8.0, with focused verification. Future TMDB genre mapping remains part of movie work. Historical row estimates below are retained for comparison.

Rows are a sensible default sequence, not a requirement to serialize independent work. C03/C04/C05/C07 can be scheduled independently after their prerequisites. The movie block can start after C01/C02 without waiting for all cosmetic work. Each new release must retain the currently working TV/offline/sync behavior.

| ID | Feature/change | Difficulty | Active hours | Prerequisites |
|---|---|---|---|---|
| C01 | Confirm movie scope and compact card layout | Moderate | 0.5–1.5 | Existing app; independent |
| C02 | Shared genre names and full multi-genre tags | Moderate | 1–2 | C01 |
| C03 | Fuller, more vivid approved genre colors | Easy | 0.5–1.5 | C02 |
| C04 | Binge genre checkboxes | Moderate | 1–2.5 | C02 |
| C05 | Move Drag below the left letter; retain Manage below | Easy–moderate | 0.5–1.5 | C01 |
| C06 | Episode/Caught up picker on the main card | Moderate | 1.5–3 | C05 |
| C07 | Replace temporary app icons with approved Nightfall icons | Easy–moderate | 0.5–1.5 | Existing app; independent |
| C08 | TMDB account connection and protected metadata gateway | High | 2–4 | C01 |
| C09 | Movie records, identity, progress and preferences | High | 3–5 | C01, C02 |
| C10 | Movie-aware backup, restore, sync and folder export | Very high | 4–8 | C09 |
| C11 | Movie search, explicit matching and mixed-list imports | Moderate–high | 2–4 | C08, C09, C10 |
| C12 | Movies view/cards, watched/undo, notes and deletion | Moderate–high | 2–4 | C10, C11 |
| C13 | US movie releases, viewing availability and refresh | High | 2–4 | C08, C09, C11 |
| C14 | Accessible A–Z jump control | High | 2–4 | C04, C12 |
| C15 | Finish remaining screens, dialogs and status presentation | Moderate–high | 2–4 | C05, C06, C12 |
| C16 | Automatic recovery copies with 30-day target retention | High | 3–6 | C10 |
| C17 | Remaining real-device and Silo acceptance | Moderate–high | 2–4 | C04, C06, C10, C12, C14, C15, C16 |
| C18 | Combined TV/movie release verification and checkpoint | Moderate | 1–2.5 | C03, C07, C13, C14, C17 |

## Optional additional TV/utility improvements

These are not prerequisites for adding movies unless referenced by a selected later feature. Decide which belong in the first dependable release; do not silently add all of them to the core total.

| ID | Feature/change | Difficulty | Active hours | Prerequisites |
|---|---|---|---|---|
| O01 | Second Caught up button below episode list | Easy | 0.25–0.5 | Existing app; independent |
| O02 | Check all shows now button | Moderate | 1–2 | Existing app; independent |
| O03 | Search provider website and accept a selected URL/ID | Moderate | 1–2 | C11 |
| O04 | In-app resumable bulk matching/review queue | High | 5–10 | C10, C11 |
| O05 | Explicit specials support | High | 3–6 | C09, C10 |
| O06 | Personal release/service/genre corrections | Moderate–high | 2–4 | C10 |
| O07 | Richer season/part/cour and missing-future-season handling | High | 3–6 | C09, C10, O05 |
| O08 | Rule-based What next? after completion | Moderate | 1.5–3 | C12 |
| O09 | Start the PC folder-export watcher at Windows login | Easy | 0.5–1 | Existing app; independent |
| O10 | Choose a code license before broader distribution | Decision + small edit | 0.5–1.5 | Existing app; independent |
| O11 | Checks/notifications while the app is closed | Very high | 5–10 | C10, C13 |
| O12 | Sourced renewal/cancellation tracking and confirmed overrides | High | 2–4 | C10 |
| O13 | Remaining source matches and watched-history review | Manual review | 1–3 | Existing app; independent |

## Later AI, family and conditional distribution work

The AI foundation is shared: implement A01 once, then add chosen features incrementally. A01–A06 total **17–32 hours** if all are chosen; no credits are spent by this plan. Family access/onboarding/sharing (F01–F03) total **12–24 additional hours**, after core completion. F04/F05 are conditional and excluded from these totals. Family recommendations do not depend on AI recommendations. AI and family are independent later tracks; their table order does not authorize either track first.

| ID | Feature/change | Difficulty | Active hours | Prerequisites |
|---|---|---|---|---|
| A01 | Secure optional AI access, privacy and budget controls | High | 4–7 | C08, C18 |
| A02 | Identify a show/movie from a remembered premise | Moderate | 2–4 | A01, C11 |
| A03 | Mood/taste recommendations from the library and outside it | High | 4–7 | A01, C02, C12, C13 |
| A04 | Natural-language search of the saved library | Moderate | 2–4 | A01, C12 |
| A05 | AI assistance for aliases and confusing season/part matches | Moderate | 2–4 | A01, C11 |
| A06 | On-demand sourced renewal/cancellation/date digest | High | 3–6 | A01, O12 |
| F01 | Invite-only family accounts with separate private libraries | Very high | 6–12 | C18 |
| F02 | First-use onboarding for each family member | Moderate | 2–4 | F01, C11 |
| F03 | Send family show/movie recommendations | High | 4–8 | F01, F02, C12 |
| F04 | Wider public access hardening | Very high / open scope | 8–16+ | F01, O10 |
| F05 | Packaged native app if the installed PWA is insufficient | Very high / conditional | 12–30+ | C18 |

## Dependency paths and release gates

- Genres: **C01 → C02 → C03/C04**, reused by movies and later recommendations. Movie credentials are not required to build the TV-side genre foundation.
- Movie data safety: **C01 → C02 → C09 → C10 → C11/C12**. C08 enables live movie metadata, while C10 gates writing real movie records safely. Existing TV IDs/history stay intact.
- Movie release information: **C08 + C09 + C11 → C13**. Missing US availability remains unknown; theatrical release does not imply streaming.
- Final core release: stable movie/card layouts → **C14/C15/C16 → C17 → C18**. Required attribution and all selected core changes must be included before C18.
- AI: **C18 + A01 → chosen A02–A06**. Movie metadata and genre filters do not require AI.
- Family: **C18 → F01 → F02 → F03**. Preserve independent private libraries.

## Scope notes for each item

- **C01 — Confirm movie scope and compact card layout:** Agree Movies placement, watched/not-for-me behavior, US release labels and proposed TMDB/gateway approach. Design decisions, not implementation approval.
- **C02 — Shared genre names and full multi-genre tags:** Normalize equivalent TV/movie labels; preserve raw genres and unknowns. Do not infer Superhero from Action. Foundation for filters, colors, movie imports and recommendations.
- **C03 — Fuller, more vivid approved genre colors:** Apply the approved Nightfall palette consistently with readable text labels and contrast.
- **C04 — Binge genre checkboxes:** One per genre; multiple selections mean any selected genre. Combine with text search, preserve hidden cards/order and keep phone controls compact. Delivered v0.8.0 after explicit owner approval.
- **C05 — Move Drag below the left letter; retain Manage below:** Keep right-middle arrows; review the phone layout where imagery may be reduced. Reuse existing drag behavior.
- **C06 — Episode/Caught up picker on the main card:** Reuse current catch-up actions and stale-state safeguards, with a clear apply interaction. No automatic loss of history from merely opening a selector.
- **C07 — Replace temporary app icons with approved Nightfall icons:** Prepare install/maskable sizes and verify PC/Android launch presentation; splash is already built.
- **C08 — TMDB account connection and protected metadata gateway:** Requires owner TMDB credential and the chosen free gateway account. Restrict/cache requests, keep credentials out of public assets, handle provider errors and add attribution. Account approval/wait time excluded.
- **C09 — Movie records, identity, progress and preferences:** Add proper movie data and separate watched state. Preserve existing TV IDs, Silo progress and personal fields; distinguish provider and media type.
- **C10 — Movie-aware backup, restore, sync and folder export:** Extend validated formats and transactions, accept old backups, protect deletion/restore races and mixed libraries, preserve owner-only access and offline storage. Release gate before real movie data is added.
- **C11 — Movie search, explicit matching and mixed-list imports:** TV/Movie choice, year/remake disambiguation, preserved source text, explicit selection and correct genre mapping. Existing TVmaze matching remains.
- **C12 — Movies view/cards, watched/undo, notes and deletion:** Reuse shared cards/genre controls with movie-specific actions; do not fabricate episodes. Keep PC/phone navigation compact.
- **C13 — US movie releases, viewing availability and refresh:** Separate theatrical/digital/future/unknown information, cache paced refreshes and attribute TMDB/JustWatch. Missing data is not proof of unavailability. Provider metadata is not independent news verification.
- **C14 — Accessible A–Z jump control:** One adjustable keyboard/touch/screen-reader control for long alphabetical lists; preserve search, zoom/text-size rules and empty-letter skipping.
- **C15 — Finish remaining screens, dialogs and status presentation:** Finish approved Weekly/Watched/Add/Match/detail refinements, focus handling, phone notices and Saved-to-check feedback. Existing screens are built; this is remaining polish/audit.
- **C16 — Automatic recovery copies with 30-day target retention:** Design capped/deduplicated local recovery copies, cleanup and safe restore previews. Browser-local copies do not provide off-device recovery; that needs a separate decision.
- **C17 — Remaining real-device and Silo acceptance:** Finish actual Firefox/Android, TalkBack/keyboard/zoom and outstanding Silo checks using agreed safe examples. Preserve user-reported successes; do not repeat already settled migration work.
- **C18 — Combined TV/movie release verification and checkpoint:** Final integrated regression/privacy/update checks, attribution, deployment and handoff. Includes integration checks beyond each feature’s focused tests.
- **O01 — Second Caught up button below episode list:** Optional maybe. Can be folded into C06; may be unnecessary once the card picker exists. Do not add its estimate twice.
- **O02 — Check all shows now button:** Reuse the existing refresh queue/lease with a manual freshness bypass, progress feedback and safe retries. Automatic daily checks already exist.
- **O03 — Search provider website and accept a selected URL/ID:** Extend explicit matching for spelling/alias problems; validate provider/type/ID. Can be TV-only earlier, then reused for movies.
- **O04 — In-app resumable bulk matching/review queue:** Reviewed batches, resumable work, ambiguity/missing-season holds and protected watched scopes. Existing maintenance CLI matching is already built.
- **O05 — Explicit specials support:** Separate regular episodes/specials and revisit queues/completion without assuming special episodes have been watched.
- **O06 — Personal release/service/genre corrections:** Store overrides separately from provider snapshots, preserve them through refresh/backup/sync and expose their provenance.
- **O07 — Richer season/part/cour and missing-future-season handling:** Preserve separately listed seasons/parts, avoid wrong alias merges and retain unknown future data. Scope needs examples before implementation.
- **O08 — Rule-based What next? after completion:** Suggest eligible saved TV/movie items with dismiss/skip/Not for me options. Does not require AI credits.
- **O09 — Start the PC folder-export watcher at Windows login:** Optional persistent startup setup; keep the helper hidden, owner-scoped and single-instance. The current session watcher already exists.
- **O10 — Choose a code license before broader distribution:** Owner choice and repository notices. Provider attribution work is already included in the movie release tasks.
- **O11 — Checks/notifications while the app is closed:** Requires a separate background/privacy/permission/storage/quota design and device checks. Current open-app checking does not do this. Re-estimate after choosing that architecture.
- **O12 — Sourced renewal/cancellation tracking and confirmed overrides:** Define trusted sources and owner-confirmed statuses first; keep Ended separate from Cancelled. A fully automated news collector is not included here; see A06.
- **O13 — Remaining source matches and watched-history review:** Initial triage estimate only. Ambiguous identities and absent provider seasons can remain held indefinitely; no fixed completion date or automatic guessed matches.
- **A01 — Secure optional AI access, privacy and budget controls:** Choose the credit use/provider, protected credentials, explicit data scope, spend controls and failure behavior. Ordinary tracking stays usable without AI.
- **A02 — Identify a show/movie from a remembered premise:** Return real, verified candidates and show whether each is already saved/watched; require explicit matching.
- **A03 — Mood/taste recommendations from the library and outside it:** Use personal preferences with permission, explain suggestions, validate real titles/availability and avoid unwanted spoilers.
- **A04 — Natural-language search of the saved library:** Translate requests into constrained local filters; do not let model text mutate the library.
- **A05 — AI assistance for aliases and confusing season/part matches:** Suggest identities/scopes for human review. Resumable batch integration depends on O04 if wanted.
- **A06 — On-demand sourced renewal/cancellation/date digest:** Gather source-linked news and summarize changes with uncertainty preserved. Recurring scheduled digests would additionally depend on O11.
- **F01 — Invite-only family accounts with separate private libraries:** Deferred until core completion. Replace owner-only gating deliberately, isolate every account, enforce access rules and verify existing-owner migration.
- **F02 — First-use onboarding for each family member:** Start a new private library rather than copying the owner’s personal master/history; guide install/import/recovery.
- **F03 — Send family show/movie recommendations:** Explicit sharing of a title/message, accept into recipient’s own list and protect viewing history/notes. Does not inherently require AI.
- **F04 — Wider public access hardening:** Optional, not scheduled: abuse controls, quotas/costs, provider-use review, privacy/account recovery and support. This is a preliminary minimum-range estimate, not public-launch readiness.
- **F05 — Packaged native app if the installed PWA is insufficient:** Not currently planned. Preliminary first-platform work only; extra platforms, signing/distribution and store review require re-estimation.

## Already built, excluded from new-feature estimates

PC/Android installed-PWA approach; hosted owner-only access and core sync; offline tracking; manual export/validated restore; explicit TVmaze matching and post-import setup; current-episode/Caught up actions in details/setup; daily metadata checks while visible/online and per-show refresh; title filing; TV episode check-off/undo; Binge sections/Not for me; mouse/touch/keyboard dragging and recent/manual activity order; original splash/gold banner; compact phone utilities and existing channel/service labels. Real-device acceptance still listed above is not a proposal to rebuild these features.

Re S3, Re S4 and The Return of the Shadow S2 were removed at the owner’s request, so their identification is not future work. Original sources/backups remain historical. Basic service labels were accepted; a TV-wide streaming-location redesign is not requested. Replacing TVmaze with TMDB is not required for movies and is not planned in this core estimate.

## How to maintain this plan

Keep stable IDs when revising order. After a selected item ships, record actual scope/checks/date and revise remaining ranges instead of resetting the full estimate. Merge overlapping tasks rather than charging both estimates; O01 may be absorbed by C06 and attribution is already in movie setup/release. Re-estimate F04/F05 and source-dependent automation after scope is known. Record user decisions before beginning explicitly deferred work.

## Additional optional brainstorms - 2026-11-08 12:19 America/Chicago

See [POTENTIAL_UPGRADES.md](POTENTIAL_UPGRADES.md) for 15 further quality-of-life/fun options (U01–U15), each with scope, prerequisites and effort estimates. They are separate from this original 42-item baseline and are not added to its core total. Nothing is selected for implementation by listing it.
