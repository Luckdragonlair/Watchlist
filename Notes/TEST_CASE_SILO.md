# Test case: Add Silo while halfway through a season

**Status:** IN PROGRESS — user imported Silo manually; see the run update below for the actual S3 E8 starting point.

## Manual run update — 2026-11-05

The user manually imported Silo and selected **Season 3, Episode 8**, superseding the originally planned S2 E8 starting point for this run. They confirmed earlier episodes were marked watched. Do not rewrite their saved progress to match the older plan below.

Issue found: Silo appeared under Friday because a future Season 4 episode was listed. The user clarified that a future season must stay out of Weekly until it starts releasing. Fixed: a fully released backlog season remains Binge; a future premiere alone is insufficient for Weekly placement. No viewing records were modified by the fix.

Verification: 21 unit/database tests and 6 browser tests pass, including a generic S3 E8 backlog / future S4 regression and caught-up waiting behavior. Production build passes. Original Silo seed exclusion remains intact. Live provider diagnosis used show #38052; the user's chosen ID/count were not independently read from their browser.

Manual follow-up: the user reported that checking Episode 8 advanced immediately to Episode 9, then they returned to Episode 8. Their wording was "unselected 9"; the exact reversal control and both episode flags were not independently inspected. Recorded as successful reported advancement/return, not proof of every saved flag.

Reload check PASS (user confirmed): S3 E8 remains next after refreshing the page, Episodes 8 and 9 are unchecked, and earlier episodes remain watched. This confirms the reported return to E8 persisted correctly.

Manual acceptance remains IN PROGRESS overall. Import, earlier-episode backfill, episode advance/return and page-reload persistence have user confirmation. Binge placement, exact available count, metadata-refresh safety and completion behavior remain to be explicitly confirmed before full Silo PASS. Original planned acceptance procedure follows.

**Purpose:** Confirm that adding a show already in progress works from scratch, independently of the original master-list import.

## Important seed-data rule

- Exclude **every Silo entry**, including Seasons 1–4 and associated status notes, from the initial *app database seed*. Do not delete them from the original master-list source.
- Do not add Silo through a preconfigured fixture to make this test pass.
- The original master file can be retained for provenance, but the Silo test must begin with **no Silo title in the app database**.

## Real viewing state supplied by the user

- Series: **Silo**.
- **Season 1:** fully watched.
- **Season 2:** Episodes **1–7 watched**, Episode **8 currently in progress / not yet checked watched**.
- **Seasons 3 and 4:** not started; do not claim any of their episodes were watched.
- *Do not assume an exact episode 8 completion time.*

## Test steps and expected behavior

1. **Initial check:** Search the imported watchlist for Silo. Expect **no existing Silo entry**.
2. **Search to add:** Find Silo with TVmaze; show the candidate and allow positive selection of the correct series, without silently linking an ambiguous search match.
3. **Fetch episodes:** Retrieve seasons, episode identifiers, episode names, synopses, dates/times where available; preserve unknown fields as unknown. Avoid duplicates when syncing twice.
4. **Choose starting state:** Select **Already Watching**, then **Season 2, Episode 8** as the current episode.
5. **Backfill watched history:** Mark Season 1 watched and Season 2 Episodes 1–7 watched using a bulk/quick onboarding action. Verify that this does not automatically mark Season 2 Episode 8 watched.
6. **Queue placement:** Season 2 Episode 8 is shown as the next available unwatched episode in **Binge** if the season is already released and not weekly airing (or in its correct active weekday if currently scheduled). Show accurate number of **released but unwatched** episodes, excluding unreleased entries. The next-episode queue must not skip Episode 8.
7. **Advance:** Checking Episode 8 watched immediately advances to the next released unwatched episode, if any. Test Undo restores Episode 8 to unwatched.
8. **Safety:** A TVmaze metadata refresh must retain watched flags, progress, manual corrections, and the right series mapping.
9. **Completion:** Reaching a verified season ending displays the agreed completion popup, and dismissal moves the completed installment to Watched. Do not infer a season is complete merely because the provider has no more episodes listed.

## Record results after execution

- Date tested:
- App build / commit:
- TVmaze show ID chosen:
- Episode count imported:
- Actual next-episode display:
- Actual available-unwatched count:
- Issues encountered:
- Final result: [ ] PASS  [ ] FAIL
