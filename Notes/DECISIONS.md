# Watchlist product decisions

Updated: 2026-11-05

## v0.1 implementation boundary

- Show detail has a Delete show action with confirmation. Deletion atomically removes the selected show, seasons, episodes, all owned viewing history (including provider-retracted episodes), personal notes/order, and linked import rows. Empty source containers remain to prevent the original seed restoring deleted entries on reload. Unlinked source entries with an unambiguous matching title/alias are also removed; entries that could belong to another same-name show are preserved for review. Preserved original files and existing exported backups are not rewritten.
- Viewing history now records show ownership (IndexedDB schema v2). Existing history is migrated without changing watched timestamps. If a legacy orphan's episode metadata was already lost, deletion first resolves its owner through TVmaze; unresolved ownership stops deletion safely rather than guessing or removing another show's history. Ordinary v2 deletion is local and requires no network.
- Stale refreshes, episode undo, and in-flight source imports must not recreate deleted show records. Re-adding through Add Show is an explicit fresh import with no deleted viewing state.

- Weekly means an actively releasing season: at least one regular episode in that season has released and another is scheduled. An announced future season does not enter Weekly before its first release. Remaining episodes in a fully released backlog season stay in Binge even if a later season has a future premiere. Weekly weekday grouping uses the active viewing season's next release, not another season's date. Confirmed future dates remain visible while waiting in Binge.

The decisions below remain the product target. v0.1 implements the basic library, TVmaze import/refresh, check-off/advance/undo, explicit catch-up, source catalog, and plain placeholder views. Recommendations, drag-and-drop, backup restore, and an installable/offline app shell are deferred.

- Each TVmaze import/refresh replaces that show's cached episode/season snapshot atomically. Viewing history and personal notes/order live in independent tables and survive refresh; orphan viewing records are retained if a provider episode disappears.
- Special episodes are excluded from the initial regular-episode queue; supporting them explicitly is follow-up work.
- Exact timestamps establish availability. A date without a time becomes available only on the following Central calendar day; today's date with unknown time is not silently treated as released.
- A confirmed completion requires provider season end date at or before today, a positive expected episode count matching the fetched regular episodes, and all those episodes released and watched. Missing provider facts never imply completion.
- The master file is preserved byte-for-byte. Its 301 non-Silo installment rows are seeded as source assertions. A user selects a TVmaze candidate for each title before metadata linking. All 5 Silo rows are omitted from the starting catalog. Source guesses about release schedules/status are labeled unverified.
- Linking a title applies source Watched claims only to released regular episodes in its explicitly listed watched seasons. A seasonless Watched assertion requires explicit confirmation of its scope. No other season is silently backfilled.
- Source notes stay attached to their original row and are copied to personal notes on linking. Manual notes are retained on refresh. Original source classification is retained for provenance; linked show placement uses current provider metadata.
- Basic Watched shows any title with saved episode history and exposes its episodes in detail, including partially watched titles. Verified completed seasons are labeled separately.

## Product target

- Personal, local-first PWA; ordinary functions must work without AI or paid cloud services.
- Keep titles, installments/seasons, individual episodes, release metadata and user viewing state independently modeled.
- Main list organizes active scheduled series by release weekday (days with no active shows hidden); unscheduled fully available items belong under **Binge**.
- A show card displays the **next available unwatched episode**. Checking it marks only that episode watched and advances the card to the next released unwatched episode. Never auto-mark earlier episodes watched.
- When caught up but future episodes are scheduled, display the **next confirmed air date and time in America/Chicago** (CST/CDT automatically), not an empty checkbox.
- If fully watched and no more episodes are scheduled, show a completion popup with series status (renewed, unknown, cancelled, concluded, etc.) and an optional similar show recommendation from the user's own Binge entries.
- The completion popup uses a red circular X to dismiss. Detail view uses a red circular curved back arrow. Watched state saves before any popup acknowledgement.
- Completion recommendations are offered even when the series is renewed. Choices: Watch Now (top of Binge), Watch Soon (after active shows), Skip (different recommendation), Pass (mark uninterested), or red X (dismiss).
- Binge offers search, visible card dragging with smooth motion, up/down reordering controls, clickable show detail panels, and persistent manual sort order. Manually reordered positions take priority over automatic ordering until explicitly reprioritized.
- Detail panel shows synopsis, service, genre, current episode, count of **available but unwatched episodes**, and separately upcoming episodes where known.
- Watched section retains episode viewing history and series renewal/cancellation status, alphabetically sorted.
- Import from existing master list; preserve originals. Do not invent titles, episodes, release times, premiere dates, or renewal facts.
- TVmaze is the proposed primary episode metadata API, with optional TMDB fallback later. Test live coverage/accuracy and honor source attribution/licensing. Cache source metadata, protect watched/manual fields during sync.
- Silo is intentionally excluded from initial app seed for a realistic mid-season add-and-catch-up test. See TEST_CASE_SILO.md.
- Claude owns visual/graphical design. ChatGPT handles architecture, functionality, behavior, API/data integration, and tests. Code should keep presentation separate from logic.

## Backup replacement behavior — 2026-11-05

- Version-1 backup files remain supported. Restore validates record types, identifiers, references, dates, duplicate IDs and history ownership before any write; unknown metadata is preserved as unknown and unlinked legacy history is not guessed.
- Preview and cancellation do not modify the library. The user can export the current state in the preview. A checkbox and final button explicitly confirm replacement of the entire library, not merging. All six collections replace atomically; storage failure preserves the prior library through rollback.
- Schema v3 keeps catalog initialization and restore revision outside the exported user data. An empty restore stays empty. New revisions invalidate pre-restore asynchronous writes and stale UI undo/detail state across tabs.

## Binge card controls — 2026-11-06

The user confirmed that Binge cards should be draggable. Up/down reorder arrows belong on the right edge, vertically centered on each card. Dragging and arrows must update the same persistent manual ordering. Current controls remain functional placeholders; drag-and-drop and final positioning are future work with Claude's visual design. Do not treat this confirmation as completion of drag support.

## Offline app behavior — 2026-11-06

- Production app address stays 127.0.0.1:5174 so viewing data remains in the same origin; development uses 5175 with separate data and no service worker. Default local launcher builds/serves production.
- Cache static shell/catalog only. Keep episode metadata and viewing history in IndexedDB; TVmaze search/import/refresh require internet. After initial cache setup, reopening and normal tracking/details/order/backup/restore work with the local server stopped.
- Do not force reload while users are working. Explicit Update and reload applies immediately; waiting updates may also activate after all old windows close. Preserve the working offline app on failed updates and avoid touching unrelated caches.
- Install manifest/icon support is present, but the user chooses installation. In-app-browser and Edge/Chrome libraries are separate; transfer via backup/restore rather than assuming automatic synchronization. Placeholder icons remain for Claude to redesign.
