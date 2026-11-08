# Watchlist design ideas

Updated: 2026-11-08 (America/Chicago)
Status: **Mixed: genre colors/checkboxes and card controls approved and built in v0.8.0; other ideas remain proposed.**

Current checkpoint: v0.9.0 primary preferences are applied to all 181 reviewed multi-genre shows; first badge matches the accent. Compact cards shipped v0.8.1. Primary-genre choice during matching/setup and a Manage editor remain future work. See HANDOFF_QUORA.md.

## Card controls - implemented v0.8.0; compact refinement v0.8.1

The owner subsequently approved compact spacing with Manage inside the title block, inline picker/Apply and contextual guidance. Compact implementation passed six targeted workflows and both builds; the older lower-action-area proposal below is superseded.

The owner authorized these on 2026-11-08. Explicit Apply now performs the existing guarded catch-up; opening/selecting does not write. The notes below preserve the original proposal.

- Put the **Drag** handle beneath the letter/art tile on the left, making its relationship to moving the card clearer. Keep the up/down arrows on the right, vertically centered.
- Keep **Manage** in the lower action area where Drag currently appears. Review desktop and compact phone arrangements before implementation.
- Add the existing **episode picker directly to the main card**, including **Caught up—all aired episodes watched**. This would let the owner select the current episode or jump to a later season without opening details.
- Reuse the existing progress safeguards: selecting a current episode marks only earlier released regular episodes; the selected episode remains next. Caught up marks released regular episodes while retaining tracking for future releases. An accidental selection must not silently lose history or invent future viewing. The exact layout/apply interaction remains to be designed.

## Other ideas discussed

- Binge genre checkboxes, one per genre, allowing multiple selections such as Comedy and Fantasy. Earlier deferral superseded by explicit implementation request; delivered v0.8.0.
- A duplicate Caught up action below the episode list is an optional maybe; the owner is satisfied with the existing top selector.
- Complete the approved Nightfall genre palette: v0.8.0 now applies the approved genre palette and fuller card tints. Use the approved references in design/nightfall-v2; final presentation work remains.
- Optional on-demand AI: recommendations based on mood and personal taste, inside or outside the saved library; identify a show from a half-remembered premise. API-credit use is undecided and no AI feature or spending is authorized by these ideas.

Family accounts and social recommendation sharing remain deferred until core work is finished. Required movie support still needs provider, tracking and import design. Existing channel/service labels were accepted and do not need a new feature.

## Movie support: recommended implementation plan - 2026-11-08

Planning only; no provider account, credential, infrastructure or application change is authorized by this note. Recommended sources: retain TVmaze for existing television; add TMDB for movie search/details/genres/US release dates. TMDB watch-provider data is powered by JustWatch and requires JustWatch attribution. Use a small restricted/cached Cloudflare Worker on the Free plan to keep the TMDB project credential out of the browser; ordinary saved tracking remains local/offline. Recheck service terms/limits before implementation or broader access. Non-commercial TMDB developer access currently requires attribution, an account and application credential; no AI API credits are required for movie metadata/filtering.

1. Confirm first movie scope: a Movies view, explicit movie matching, interested/watched/not-for-me states, notes, US release/availability labels and common genre filtering. Keep existing TV episode behavior.
2. Owner obtains a TMDB developer account/application credential; prepare the restricted metadata gateway and store its credential as a server secret, outside the public app and Git. Free Cloudflare account needed if this gateway is chosen.
3. Add real movie records/progress/preferences and provider-scoped identities; preserve all existing TVmaze IDs and television records. A movie is not a fake season/episode.
4. Introduce shared app genre keys while retaining raw source genres: e.g. TVmaze Science-Fiction and TMDB Science Fiction map to the same key. Preserve multiple tags, explicit unknowns and personal overrides separately. Do not infer Superhero from Action.
5. Add TV/Movie selection to Add/Match. Show movie year, synopsis and identifying details; require explicit candidate selection, especially for remakes and same-name series.
6. Apply the planned genre checkboxes to both movie and TV views through one filter component. Multiple checks mean any selected genre; text search narrows the result; no checks means all. Matching all genres uses each item's complete tag list, not only its primary card badge.
7. Add movie cards, a single Mark watched action/undo, notes and safe removal. Keep genre controls/navigation compact on phone.
8. Add region-aware release/availability metadata and paced refresh: distinguish US theatrical, digital, future and unknown data. A theatrical release does not imply subscription-streaming availability. Missing provider data means unknown, not proven unavailable. TMDB watch-provider responses supply a TMDB destination URL, not full service deep links.
9. Extend atomic storage, backup validation/restore, shared snapshots/conflict handling, readable folder exports and offline cache. Read existing backups and protect all TV history, notes, order and Silo onboarding; older clients must fail safely on the new movie-aware format.
10. Verify movie-only progress/deletion, TV/movie ID collisions, remake matching, multi-genre filtering, release boundaries, offline reopen and two-device sync using disposable fixtures. Then publish with required TMDB/JustWatch credits and update the handoff.

Source checks (2026-11-08): [TMDB FAQ and free non-commercial attribution terms](https://developer.themoviedb.org/docs/faq), [application credentials](https://developer.themoviedb.org/docs/authentication-application), [movie search](https://developer.themoviedb.org/reference/search-movie), [movie genres](https://developer.themoviedb.org/reference/genre-movie-list), [release types](https://developer.themoviedb.org/reference/movie-release-dates), [watch providers and JustWatch attribution/link limitations](https://developer.themoviedb.org/reference/movie-watch-providers), [Cloudflare Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/).

TMDB also supports television, but moving existing TV matching/history to TMDB would be a separate provider migration, not a prerequisite for movies. Family access and AI recommendations remain deferred.
