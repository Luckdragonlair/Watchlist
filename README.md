Watchlist 🍿
Watchlist is a personal, offline-first Progressive Web App (PWA) for keeping track of genre TV series and movies without juggling streaming schedules, spreadsheets, or subscriptions.

It focuses on science fiction, fantasy, horror, superheroes, supernatural fiction, animation, anime, and other speculative storytelling.
Project status: Early planning and prototyping. The features below describe the intended application, not a completed release.

What Watchlist will do
- Weekly schedule: Group actively releasing shows by weekday, showing the next available unwatched episode.
- Episode-by-episode progress: Check off an episode to advance automatically to the next available one. When caught up, show the next release date and time in Central Time, if known.
- Binge queue: Keep unscheduled and fully available shows in a searchable, drag-and-drop list, with Watch Now and Watch Soon priorities.
- Show details: See a synopsis, service, genre, series status, and counts of available unwatched and upcoming episodes.
- Watched history: Retain completed episodes and seasons along with renewal, cancellation, or conclusion information.
- Completion prompts: Celebrate finishing a season and optionally recommend another show already in the Binge queue.
- Offline use: Store watchlist data locally, with JSON import/export for backup and transfer.
- Metadata refresh: Fetch available episode listings, summaries, and release information from TVmaze, with additional sources considered where useful.
Ordinary actions such as checking off episodes, searching, sorting, and rearranging shows will not require AI or a network connection.
Planned technology
Area	Proposed choice
Frontend	React + TypeScript + Vite
Styling	Simple, replaceable UI components and CSS
Local database	IndexedDB (via Dexie)
Installable/offline app	PWA / service worker
Episode metadata	TVmaze API; optional secondary sources
Testing	Vitest
Hosting	Static hosting, likely Cloudflare Pages


The technical choices are provisional until implementation begins. The first version does not require user accounts, cloud sync, or a dedicated backend.
Data principles
- A title, its seasons/installments, and its episodes are separate records.
- Release availability and personal watched status are separate facts.
- Unknown dates, episode counts, and renewal information remain unknown, never guessed.
- Imported metadata must not overwrite manually entered viewing history.
- External metadata is cached locally with source attribution and refreshed only when needed, subject to provider licensing terms.
- Release times are displayed in the America/Chicago time zone, handling CST/CDT automatically.
Development roadmap
- [ ] Finalize episode, release, and viewing-state schemas
- [ ] Build basic weekly schedule and Binge queue
- [ ] Add episode check-off, automatic advancement, and undo
- [ ] Add show details, sorting, drag-and-drop, and priority controls
- [ ] Add completed-season notifications and local recommendations
- [ ] Import the existing master watchlist and resolve ambiguous entries
- [ ] Integrate TVmaze search, episode import, and metadata updates
- [ ] Add reliable JSON backup/restore and offline PWA behavior
- [ ] Test responsive desktop/mobile behavior
- [ ] Consider optional secure OpenAI-assisted research and cloud sync later
Important test case: Silo
Leave Silo out of the initial bulk import. Add it through the app afterward to verify mid-season onboarding: Season 1 watched; Season 2 Episodes 1–7 watched; Season 2 Episode 8 in progress (not yet completed). Future seasons stay unwatched. See notes/TEST_CASE_SILO.md when the notes folder is added to the repository.
Project organization
The project will keep key decisions, outstanding tasks, and test cases in a notes/ folder. Functionality and data behavior are being specified first; the final visual treatment may be developed separately and integrated later.
Setup
Not available yet. This repository is at the planning/prototype stage. Installation, development, and deployment instructions will be added once the initial app is scaffolded.
Data sources and attribution
TVmaze is the proposed primary episode metadata source. Its API and content have separate usage and attribution conditions; review the TVmaze API documentation and applicable licensing before shipping an integration. Any additional provider will be credited as required.
License
A code license has not yet been selected. Do not assume the repository or third-party metadata is open-source or freely redistributable until licensing is explicitly established.
