# Current library export on this PC

The hosted Watchlist library is the shared viewing-state source. A small read-only PC helper keeps two private working exports in `D:\Watchlist\Library`:

- `Watchlist Current.json`: valid version-1 app backup with all shows, seasons, episodes, notes, watched timestamps and source rows.
- `Watchlist Current.md`: readable Weekly/Binge/Watched summary plus source entries not linked. Classifications use the app's own model, not a separate guessed schedule.
- `export-status.json`: cloud revision/hash and export timestamp.
- `Matching Review.md` and `Remaining Matching Choices.md`: current matching progress/review, maintained separately from the automatic export.

`Library/` is excluded from GitHub. The original root master TXT and `originals/` are not rewritten. The curated master Page and root current-master document do not automatically change when a show is added to the app. This helper exports the app library; it does not silently reconcile those independent documents.

## Operation

From D:\Watchlist:

```powershell
./Start-LibraryExport.ps1       # start hidden read-only export watcher
./Start-LibraryExport.ps1 -Once # export the latest cloud version once
./Start-LibraryExport.ps1 -Stop # stop only the verified helper process
```

The owner approved the watcher for the current Windows session on November 7. It checks about once a minute while this PC is running and online. No automatic startup entry or scheduled task was installed; restart it after signing out/rebooting. Edits must first reach the cloud before this export can include them. Offline changes still waiting on a phone are not visible to the PC helper yet.

The helper uses the existing Firebase CLI login. Run Connect-Firebase.ps1 if authorization expires. It is fixed to project genre-watchlist and the configured owner; it does not read other projects or write Firestore. Credentials remain in CLI-managed storage. Helper status/errors and the process ID live under ignored `.tools/`.

The manifest is polled; unchanged revisions avoid downloading all chunks. Changed snapshots are re-read, checksum/generation/size/schema checked, then each output file is replaced atomically. Failures keep the last good export. This is a current working export, not a rotating historical-recovery service. Retain independent backup files.

## Reviewed matching maintenance

Matching uses local provider caches and explicit source-row IDs. Unclear title/part mappings and absent seasons remain held. No source entry is deleted. Existing personal records are protected; current episodes are not guessed. Pre-change snapshots and receipts are private under originals/. Live updates use one atomic commit with a server update-time precondition; a changed generation or stale state stops the write. The helper validates the same payload limit/schema as the app.

Do not run apply-reviewed-matches.cjs merely to experiment: it performs live maintenance and requires the owner's concrete batch approval. Its default approved batch is specifically the November 7 138/59 plan; the owner-selected path is limited to the three recorded choices. The full likely-match/resumable UI remains future work.

When updating the app's backup schema or classification code, restart the watcher after testing so its validation/classification module is refreshed. The old watcher refuses incompatible data and retains the last good files rather than guessing.
