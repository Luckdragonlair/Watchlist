# Primary genre review

Open **http://127.0.0.1:5188/** on this PC. The helper is running for this Windows session.

Choose one radio button per show. Each choice saves automatically to **D:\Watchlist\Library\Primary Genre Choices.json**. Search, Unreviewed only and Next unreviewed help work through the list. Previously selected choices return after reloading or restarting. Download choices is an optional extra copy. No need to send a screenshot of every choice: tell the agent when review is ready.

This review covers all 181 multi-genre shows in the current 196-show exported library (shared revision 160), across all app sections. It does not include unmatched source titles or fabricate movie metadata. No radio is preselected solely from automatic color priority. The review does not yet change the app.

## Start or stop

From D:\Watchlist, run ./Start-GenreReview.ps1. Stop with ./Start-GenreReview.ps1 -Stop. Saved choices are retained. The service binds only to 127.0.0.1:5188; it is a PC-local page, not a public site or a phone sync feature. No startup-at-reboot task is installed.

The server uses the existing exported library snapshot at startup; it does not read the real browser database or write to Firestore. To include newly added shows, refresh the read-only export using ./Start-LibraryExport.ps1 -Once, then stop/start this helper. Earlier choice rows are preserved, including stale rows requiring review before eventual application. No notes/history appear in the page/API or choices file. Library/ stays Git-ignored.

## Verification and next work

Focused disposable fixture coverage verifies radio choice exclusivity, save/reload/restart persistence, only multi-genre rows, responsive fit and local-only/valid-choice writes. Run node --test tests/genre-review.test.cjs. The shipped app remains v0.8.1.

After the owner completes review, use this file as an explicit choice list. First implement a safe personal primary-genre preference and its backup/sync/refresh preservation, then verify each current provider identity and chosen genre before applying. Keep all other genre tags for filtering and put the selected primary first. The new-show match/setup picker remains future work. Do not edit provider genres or the original master to simulate a preference.
