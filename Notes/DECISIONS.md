# Watchlist product decisions

Updated: 2026-11-06

## Primary device target — Android and PC

The user reaffirmed on 2026-11-06 that Watchlist should be easy to use on both an Android phone and a PC. Treat this as a primary product requirement, not a PC-only app with mobile support postponed indefinitely.

- Keep one responsive, touch-friendly web app/PWA, usable in a browser or optionally installed on either device.
- Target the same watchlist, viewing progress and manual ordering across devices, with offline changes synchronized safely when connected. Backups are protection/transfer tools, not the intended routine synchronization workflow.
- The current 127.0.0.1:5174 address is a local development/testing stage. A phone cannot use that loopback address to reach the PC's app. Plan a stable hosted HTTPS address accessible from both devices.
- Hosted access and secure cross-device sync remain unimplemented. Choose their architecture and access controls before deployment; no provider, account scheme, paid service or public publication has been authorized by this reminder.
- Browser installation is optional and separate from access/sync. Installing in Edge on the PC alone does not provide Android access or shared progress. Test real Android layout/touch behavior and offline/reconnection behavior as part of delivery.
## v0.1 implementation boundary

- Show detail has a Delete show action with confirmation. Deletion atomically removes the selected show, seasons, episodes, all owned viewing history (including provider-retracted episodes), personal notes/order, and linked import rows. Empty source containers remain to prevent the original seed restoring deleted entries on reload. Unlinked source entries with an unambiguous matching title/alias are also removed; entries that could belong to another same-name show are preserved for review. Preserved original files and existing exported backups are not rewritten.
- Viewing history now records show ownership (IndexedDB schema v2). Existing history is migrated without changing watched timestamps. If a legacy orphan's episode metadata was already lost, deletion first resolves its owner through TVmaze; unresolved ownership stops deletion safely rather than guessing or removing another show's history. Ordinary v2 deletion is local and requires no network.
- Stale refreshes, episode undo, and in-flight source imports must not recreate deleted show records. Re-adding through Add Show is an explicit fresh import with no deleted viewing state.

- Weekly means an actively releasing season: at least one regular episode in that season has released and another is scheduled. An announced future season does not enter Weekly before its first release. Remaining episodes in a fully released backlog season stay in Binge even if a later season has a future premiere. Weekly weekday grouping uses an actively releasing season's next scheduled episode, independently of the oldest unwatched episode. Older backlog does not block a later season once it actually starts releasing (clarified 2026-11-07). Confirmed future dates remain visible while waiting in Binge.

The decisions below remain the product target. v0.1 implements the basic library, TVmaze import/refresh, check-off/advance/undo, explicit catch-up, source catalog, and plain placeholder views. Backup/restore and the installable/offline app shell are implemented. Recommendations and drag-and-drop remain deferred.

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

## One-click app access and synchronization — 2026-11-06

The user prefers one-click access on Android and PC, opening in an app window rather than requiring an ordinary browser tab. Installed standalone PWAs are the preferred delivery approach to evaluate first: a Windows app/taskbar shortcut and Android app/home-screen icon, with a one-time browser-based installation step. Separate native Windows/Android applications are not required merely to meet this launch experience; reconsider packaging only if real device testing reveals a limitation.

The user also explicitly wants changes made on one device to remain up to date on the other. Shared library/progress/order synchronization is a product requirement, distinct from installing the UI or updating its code. Hosted HTTPS access, secure synchronization and offline conflict handling remain to be designed and implemented. The current local-only build does not provide cross-device sync. No hosting/account/provider deployment or paid service was selected or started by this discussion.

## Preferred browser — Firefox — 2026-11-06

The user uses Firefox for pretty much everything. Treat Firefox as a primary compatibility target on Windows and Android, and do not require switching the default browser to Edge/Chrome. Existing automated browser/PWA tests used Edge; real Firefox and Android launch/offline behavior still need verification.

Mozilla currently documents Firefox Windows web apps opening in their own taskbar-pinnable window (support can depend on version/install source) and Firefox Android's menu Install / Add to Home Screen flow. Guidance should include Firefox rather than implying only Edge/Chrome are usable. One-click app-style access remains the desired outcome; verify actual behavior on the user's devices. Cross-device app progress sync remains separate from browser selection or Firefox Sync.

Sources checked: https://support.mozilla.org/en-US/kb/web-apps-firefox-windows and https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android.

## Free Firebase and Google sign-in — 2026-11-06 07:21 CST

The user approved Firebase Spark and Google sign-in only while free. They created Genre-Watchlist (project ID genre-watchlist), registered a web app and supplied public client settings. Do not attach billing or upgrade to Blaze. Use classic Hosting, Auth and Firestore within Spark quotas; no Cloud Functions, Cloud Storage or paid add-ons. Optional Gemini in Firebase is currently free and not required. Maintain separate owner-bound hosted/local databases and require deliberate migration; sign-in does not upload the existing library. Cloud writes remain disabled until validated sync and security-rule tests pass.

## Firebase development access — 2026-11-06 07:56 CST

User authorized direct Firebase management for this project during development and completed Firebase CLI OAuth login. Limit administrative actions to project genre-watchlist and free Spark services. Do not enable billing or affect other projects. Preserve original files and the existing local personal library/backups. User may revoke the CLI account authorization later. CLI credentials remain in the tool-managed user configuration, not project files or chat.

## Shared-library synchronization implementation — 2026-11-06 10:27 CST

Use state-based three-way synchronization: persisted acknowledged baseline + current transactional local records + latest server snapshot. Persist upload intent before sending; atomically rebase later local changes after acknowledgement. Lost replies/restarts recover provable commits; ambiguous later advances pause with local data retained. This supersedes the proposed per-mutation outbox approach and catches existing direct preference/source writes without requiring every call site to enqueue an event. Sync-only settings stay outside version-1 backups. Original local origin stays independent until fresh-backup migration.

Shared snapshots use owner-only Firestore manifest/chunk paths, revision compare-and-swap, SHA-256 verification and atomic validation of all declared chunks. Limit eight UTF-8 chunks and 6 MB total to stay within transaction/rules limits. Independent saved edits merge; concurrent same-field edits, conflicting order, deletion versus old-life edits and restore-generation conflicts pause for explicit complete-library choice. Keep draft notes visible when remote notes change; replacing newer saved notes requires explicit choice. The app synchronizes while open/connected and retries on reconnect/reopen; closed-app background sync is not promised. Billing must stay disabled.

## Nightfall foundation - 2026-11-07 08:20 CST

Approved V2 references now live unchanged under design/nightfall-v2. The presentation foundation preserves existing data and sync behavior. Self-host the approved freely licensed fonts, with explicit hosted allowlisting and offline caching. Genre colors always include text. Existing arrows remain visible and operate the existing order; do not add cosmetic V2 tabs or section controls before their persistent model is implemented. Account details can collapse while sync errors/conflicts remain visible.

## Weekly placement clarification - 2026-11-07 09:36 CST

Release placement and watch-queue order are separate. An active later season puts the show in Weekly even with unwatched older seasons. Do not mark those older episodes watched or advance the watch queue simply to change placement. A future season that has not released a regular episode still leaves backlog in Binge. This preserves the Silo future-premiere protection while fixing Dexter's active-season case.

## Post-import show setup - 2026-11-07 10:05 CST

Every successful provider show import or source match opens setup, with optional current episode and prefilled saved notes. This applies once per linked series, including all linked source installments, not after importing a raw list file or restoring a whole backup. Save notes and explicit earlier released regular-episode catch-up atomically; preserve existing selected/later watched flags and ignore unknown-release/special episodes. Leave progress unchanged when no episode is selected. Skip/Escape keeps the imported show and the source's explicitly applied Watched assertions but discards optional setup edits. Return to the originating library view or filtered Import queue; Add Show returns to the last library view. Native modal focus stays contained and returns to the list heading. Guard stale notes, library revision and show lifecycle so a setup cannot overwrite newer notes or resurrect a removed/restored show.

## Reviewed matching and local current export - 2026-11-07 10:52 CST

The owner authorizes assistance matching remaining shows, but requires review before changes that could mislabel or lose shows/seasons. The owner separately approved sending pending titles only to TVmaze, 138 concrete clear matches, and three named adaptation choices. Never generalize those approvals to held cases. Existing records and source raw text are preserved; only explicitly scoped source Watched seasons may add watched records. Silo and unresolved Re labels remain held. The automatic folder export is a separate read-only current app export, private/Git-ignored; it does not rewrite original files or the curated Page. Automatic startup is not installed.

## Caught up and release versions - 2026-11-07

Caught up is an explicit progress action, available in setup and show details, not an ended/untracked status. Mark every currently released regular episode across all seasons, preserving existing watched timestamps and all future, special, unknown-release and orphan records. Use the same Central-time release rules (date-only episodes become available the following Central calendar day). Setup notes and progress save atomically under existing revision, lifecycle and stale-note guards. New known releases enter the normal queue; unknown future episodes require metadata refresh. Empty episode lists are a safe no-op. Completed series may still appear in Watched under existing completion rules without being removed from tracking.

The visible version had remained v0.1/package 0.1.0 while Git and content-based worker versions advanced. This milestone is 0.2.0, read directly from package.json. Increment the release version for future shipped behavior changes; use patch releases for fixes and minor releases for new features. Never rename IndexedDB databases, alter backup format versions or reset libraries merely because the app release version changes.

## Periodic metadata discovery - 2026-11-08

Supersedes manual-only discovery. Check every linked tracked show after 24 elapsed hours from its last successful metadata fetch, including caught-up/Watched and unknown/Ended statuses. TVmaze statuses do not establish a separate definitive cancellation reason; do not infer cancellation from lack of episodes, a long hiatus or Ended. A confirmed-cancellation override is deferred until an explicit status source/owner control exists. Keep checking conservatively.

Run only while the app is visible, online and outside manual mutations, restore or import setup. Check on launch, focus/visibility return, reconnect and a one-minute due-work timer. Closed/suspended apps cannot guarantee scheduled work; resume overdue checks on reopen. This adds no paid service or server scheduler. Sequential three-request bundles are spaced by two seconds; failures stop a sweep, back off globally 15 minutes and retry the failed show after an hour. Device-local expiring leases prevent duplicate same-browser workers; shared syncedAt timestamps reduce repeat work across devices, without a cross-device global lease.

Validate provider records and identity before committing. Replace only metadata through the existing atomic refresh path; retain personal records and orphan viewing history. Recheck library revision, show lifecycle, latest metadata, lease ownership and sync-conflict state in the write transaction. Discard stale results after restore, deletion/re-add or another refresh. Never overwrite another tracked show's provider identifiers. Retry/lease settings are local housekeeping excluded from backups/cloud. Manual refresh stays available. Automatic checks do not rematch held source titles or find separately identified reboots.

## Filed title names - 2026-11-08

At the owner's request, move only a leading standalone A or The to the end with a comma (case-insensitive prefix, canonical suffix A/The). Do not strip An or letter prefixes within words. Apply this idempotently to stored show names in saveBundle for manual imports, source matches and metadata refresh. This supersedes preservation of provider spelling specifically for the leading-article placement; provider IDs/URLs remain the identity. Preserve original master bytes and source raw/title fields used for matching/provenance; no bulk library migration.

Use the same filed representation for show-card/unmatched-group display, alphabetical comparators and artwork initials. Existing names display consistently before their next refresh saves the new representation. Search both leading and trailing article forms. Stored manual order remains primary; the comparator is only its alphabetical tie-breaker. Candidate search results and original source rows keep provider/source spelling for explicit identity review. Reuse these helpers for the future V2 alphabetical sections/A-Z index. No schema, backup-version or sync-protocol change.

## Provider blank dates and sync validation - 2026-11-08

TVmaze uses airdate='' for some announced episodes (confirmed for Kaiju No. 8 episode 3379036). Treat only that exact empty airdate as unknown/null at the provider boundary and during backup validation; do not guess a date, mark it available, or loosen malformed nonblank date/calendar validation. Normalize legacy stored blank airdates atomically once before each sync-engine instance reads its first snapshot. Do not reset revisions, show lifecycles, watched history, notes, order, sources or other metadata for this repair.

Separate invalid library data from genuine three-way sync conflicts. Validation errors show an invalid-data notice, export and retry, without complete-library replacement choices. Keep automatic metadata checks paused during invalid state. A validation fix/update can retry normal merge; actual incompatible edits retain existing explicit conflict resolution. Preserve the owner's exported before-backup privately; never restore it over newer edits merely to repair a metadata value.

## Binge organization and Match queue - 2026-11-08

Implement the approved Ready / Upcoming & TBA / Not for me structure. Ready requires available unwatched regular episodes and Binge placement, then groups by persisted preference: Watching now / Watch soon (manual arrow order) / Everything else (filed-title alphabetical, menu only). Future/unknown-only Binge shows go to Upcoming by confirmed date (including date-only records without invented time) or alphabetical TBA. Availability and active Weekly rules remain authoritative; section choice is retained while a show waits. Not for me is reversible, hides active Weekly/Ready/Upcoming placement, and preserves all records and Watched history. All linked shows still receive periodic metadata checks.

Legacy preferences without a section map to Watch soon without being rewritten, retaining their existing rank. New imports explicitly start in Everything else. Moving sections appends to the destination manual order, preserves notes/history, and guards revision/lifecycle. Arrows affect only their Ready section, including hidden-by-search peers; first/last arrows are disabled. Section/rank edits share existing cross-device ordering conflict protection. No dragging or A-Z rail is claimed.

At the owner's request, remove source matching queues from Weekly/Binge/Watched. Import adds a file and shows source counts; Match is a dedicated tab beside Import, accessible on phones, containing only pending/review rows and a persistent in-session filter. Matching remains explicit and links all pending installments of the selected title within that source, then offers setup and returns to the filtered Match queue. Imported/excluded rows stay stored but do not clutter Match. Original source text, held/missing-season entries and Silo exclusion stay unchanged.

Backup/shared payload format 2 carries the optional validated bingeSection preference. Read format 1 for old backups/libraries, export new snapshots as 2, normalize sync comparisons to 2 and preserve all preference fields. This deliberate version fence prevents older validators from silently stripping section choices: update every device before using the new shared library. Cloud manifest/rules version and IndexedDB schema remain unchanged. The folder export uses the same pure placement/title helpers; a renderer-version stamp refreshes its Markdown after an app-format upgrade even if the cloud revision is unchanged.

## Phone content-first layout - 2026-11-08

Owner supplied a phone recording showing utility controls consumed the first screen. Below 840px, use a single compact brand/More header, bottom primary navigation, and a collapsed native details menu for Import/Match, backup export/restore, installation/offline options and timezone. Keep one instance of each backup component. Desktop actions remain exposed. Keep update actions, offline/setup errors and all sync failures/conflicts outside the menu; compact only healthy account/sync information. Search remains directly available. More closes on utility navigation and Escape, with heading/opener focus; do not intercept a restore dialog's safe Escape action.

Hide empty Ready section headings when populated groups exist; show one empty-state paragraph when no episodes are ready. Keep the three Binge filters on one compact phone row, with 44px minimum touch targets. Reduce phone heading/notice whitespace so first episode controls appear above bottom navigation on ordinary 320px/412px screens. This is a presentation change only: no section/progress/order/source/schema/sync-rule changes. Reopening/resizing restores the appropriate utility layout. Real Android/Firefox and assistive-tech acceptance remain separate from automated Edge viewport checks.


## Original splash, gold banner and Weekly launch (v0.6.0) - 2026-11-08

The owner approved Claude's original dark Brick alley (04) and Gold banner (07), with the original white flash and approximately five-second sweep/flash/fly-up sequence on each page launch. Shorter timing, softened flash and earlier logo flight were rejected previews and are not used. This supersedes the earlier proposed brief/nonblocking reveal: startup data/auth loading proceeds underneath, but the decorative overlay remains for the approved sequence. Navigation inside the app does not replay it. No sound or skip control. Reduced motion uses the original static/fade path (about 1.6 seconds); forced colours bypasses the scene. Independent JavaScript/CSS failure cleanup prevents a stranded overlay. Limelight, the brick image and all runtime files are local, hosted-allowlisted and cached offline. The manifest/theme background is #05070d.

The banner replaces the duplicate navigation wordmark; the version remains visible. Phone More/bottom navigation stay compact. Account and healthy sync status occupy the banner status area; expanded account, errors/invalid data/conflicts get a full-width row, preserving actions. No library data, matching, schema, backup format or sync rules change. Source files are preserved unchanged in design/claude-splash-banner with selected source SHA-256 hashes.

Weekly is the default on a fresh launch/reload. Weekday sections start with today in America/Chicago, then cycle forward through the week, skipping empty sections. Existing placement and per-day show order are unchanged. The clock updates every minute and immediately on focus/visible return; this is not a closed-app scheduler.

## Owner-removed placeholders - 2026-11-08

Removed exactly Re S3, Re S4 and The Return of the Shadow S2 from the live unmatched source queue (shared revision 79), verified server readback and refreshed Library/Watchlist Current.json/.md. All matched shows, seasons, episodes, viewing timestamps, notes, preferences, source metadata, lifecycle and epoch values were preserved. Current curated master Page and readable Current.md already contain none of these exact placeholders; no similarly named Re:ZERO or Shadow title was removed. Historical originals, raw imported source text and existing backups remain unchanged. Active starting catalog is now 298 rows / 206 titles; an exact SHA/row-ID/raw-title removal ledger prevents the normalization script reintroducing them. Original normalization audit remains historical. No app schema, sync rules, billing or hosted assets changed.


## Card dragging and active Binge order (v0.7.0) - 2026-11-08 08:58 America/Chicago

Watching now and Watch soon have visible Drag handles for mouse/touch. Touch scrolling elsewhere on a card stays normal. Drag within the same section; started shows stay above untouched shows. Keyboard: Space/Enter picks up, Up/Down or Home/End chooses a position, Space/Enter saves, Escape cancels. Arrow buttons use the same atomic saved-order path and remain available. Long queues auto-scroll while dragging near the viewport edges. Filtered moves retain hidden cards; cancellation, navigation, resize and changed-state checks discard the preview. Drops are guarded against restore, deletion/re-add, activity, section, order and synchronization changes. Personal notes/history/metadata are not replaced by reordering.

Ready shows with recorded regular-episode progress automatically appear first in Watching now, newest recorded watch activity first. This includes onboarding/source watched records, whose timestamps reflect recording/import time rather than independent historical viewing dates. Unchecking the latest episode removes that activity; no new timestamp is invented. Actively releasing Weekly shows, upcoming-only shows and Not for me keep their placement rules. Dragging or arrows saves a manual override for the started group until Recent is chosen. Untouched manually selected Watching now shows stay below started shows and keep their own manual order. Alphabetical groups remain alphabetical.

A small optional preference flag preserves the started group's manual override. New backups/shared snapshots use format 3; formats 1 and 2 remain readable. Update Watchlist on both PC and phone. Older clients reject the new format rather than silently stripping the preference. Database names/schema v3, cloud manifest/rules, originals and personal library generation are unchanged. The read-only folder renderer shares grouping/activity rules and uses renderer version 3; restart its session watcher after this update.

User priorities: family access and social recommendations are deferred until the core app is finished. Movie support is required future work; provider, tracking/import behavior and release availability need design before implementation. API credits have no assigned feature; discuss their use later and do not spend them as part of this milestone. No family accounts or movie provider is enabled by this change.

## 2026-11-08 - Genre filters and card progress approved

Supersedes earlier deferral: owner requested genre colors/checkboxes, Drag below the letter, Manage below and a main-card episode picker. All saved genres participate in Binge OR filtering, combined with search; no checks means all. Filters are session-only, do not change placement/order or delete hidden records, and do not affect Weekly/Watched. Approved palette always includes written labels. Provider metadata stays raw; display aliases are separate. Current episode/Caught up requires explicit Apply and existing atomic setup safeguards; future tracking is retained. No additional notes editor is added to cards.

## 2026-11-08 - Compact cards approved

Owner approved the compact comparison. Default cards use tighter spacing with Manage in the identity block and contextual picker guidance visible after selection. Retain accessible picker labeling and explicit Apply, 44px targets and natural card growth for long/enlarged text. Reserve space for arrows on phone; do not compress by clipping text or hiding essential actions. Verification should target the changed card surfaces and affected controls, not unrelated features.

## 2026-11-08 - Owner-selected primary genre

Owner requested a separate fast review of all existing multi-genre shows before future match-confirmation changes. No inference from the first alphabetical badge; no AI classification/spending. Review choices are explicit radio selections saved privately on this PC. Eventual primary genre should determine card accent and be displayed first while retaining all tags for filtering. Persistence/application and match/setup UI remain unbuilt until review is ready; do not rewrite provider genre metadata or infer decisions for unreviewed shows.

## 2026-11-08 - Apply the completed primary-genre review

Owner supplied all 181 explicit choices. Store optional primaryGenre in personal preferences rather than rewriting provider genres. Card color and first badge use this preference; remaining genres still filter normally. Preserve the personal choice even if future provider metadata omits it, adding it only to effective display/filter tags. Missing preferences retain automatic fallback, displayed first. Format 4 prevents older clients silently discarding new preferences; formats 1-3 remain readable. The matching/setup picker is deliberately still deferred. Only a validated current identity/genre match may be batch-applied, with atomic update-time guard and no overwrite of notes/history/order.

## 2026-11-08 - Recurring documentation and checkpoint upkeep

Owner reaffirmed that notes/documentation and proportional local/GitHub consistency checks are required after every GitHub update or sizeable change, not only when switching agents. Maintain this as part of ordinary completion without waiting for another request. Documentation-only updates do not require application test suites. A handoff does not itself pause or finish the project.

## 2026-11-08 - Setup primary genre, programming-only phase

Owner authorized adding primary-genre radios to the existing setup after a successful provider match/Add Show import. Preselect the saved personal choice or existing automatic default; preserve a saved choice omitted by later provider metadata. Save with notes/progress atomically and reject concurrent primary-genre changes before any writes. Skip does not change the preference. No new format/schema is needed. Explicit owner instruction: do programming now, hold all bug/testing until told to begin. This source draft is not a verified release and must not be automatically committed/pushed/published as one. Existing-show editor remains separate.

## 2026-11-08 - Testing hold lifted for setup genre selector

Owner explicitly authorized focused selector/saving tests. The earlier hold is superseded. Twelve setup unit checks and three targeted browser scenarios passed; no unrelated suites were run. Retain ordinary verified-feature release/checkpoint workflow. Matching setup now supports the preference; an existing-show Manage editor remains separate.
