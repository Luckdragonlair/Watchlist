# Watchlist design ideas

Updated: 2026-11-08 (America/Chicago)
Status: **Brainstorming / proposed future updates. Not implemented; not authorization to start implementation.**

## Card controls

- Put the **Drag** handle beneath the letter/art tile on the left, making its relationship to moving the card clearer. Keep the up/down arrows on the right, vertically centered.
- Keep **Manage** in the lower action area where Drag currently appears. Review desktop and compact phone arrangements before implementation.
- Add the existing **episode picker directly to the main card**, including **Caught up—all aired episodes watched**. This would let the owner select the current episode or jump to a later season without opening details.
- Reuse the existing progress safeguards: selecting a current episode marks only earlier released regular episodes; the selected episode remains next. Caught up marks released regular episodes while retaining tracking for future releases. An accidental selection must not silently lose history or invent future viewing. The exact layout/apply interaction remains to be designed.

## Other ideas discussed

- Binge genre checkboxes, one per genre, allowing multiple selections such as Comedy and Fantasy. Explicitly deferred; see TODO.md.
- A duplicate Caught up action below the episode list is an optional maybe; the owner is satisfied with the existing top selector.
- Complete the approved Nightfall genre palette: the current app has only the foundation's restrained accents. Use the approved references in design/nightfall-v2; final presentation work remains.
- Optional on-demand AI: recommendations based on mood and personal taste, inside or outside the saved library; identify a show from a half-remembered premise. API-credit use is undecided and no AI feature or spending is authorized by these ideas.

Family accounts and social recommendation sharing remain deferred until core work is finished. Required movie support still needs provider, tracking and import design. Existing channel/service labels were accepted and do not need a new feature.
