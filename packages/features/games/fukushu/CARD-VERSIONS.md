# Card content versions: first slice

Refs #310; follows #323 and #324. This document fixes the boundary before the
implementation. It separates **saved card content** from **study/review history**.
The current server has no FSRS state or review-log table.

## Upstream behavior and compatibility

The upstream main commit checked on 2026-11-17 is
`0efee271a13f15096beb8cbaaea25092c5927b29`.

- [updateDeck](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/decks.ts)
  matches `sourceKey`, retains the existing card ID/creation time, and overwrites
  its payload. An incompatible answer/kind or sufficiently different prompt can
  reset FSRS state under the same question ID. Review logs remain, but the old
  payload is not retained. Removed source cards are disabled rather than deleted.
- [Anki text import](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/importAnki.ts)
  uses a GUID when available, otherwise a hash of note type and front plus a
  direction. Editing the front is not a safe way to infer the old card identity.
- [Record formats](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/infrastructure/db/schema.ts)
  include question IDs and answers in review logs but no immutable payload-version
  reference. `historyRevision` invalidates study sessions after history resets;
  it is not a card-content version number.
- [History reset and APKG import](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/apkgStore.ts)
  include replacement/recalculation behavior. Those operations must not become an
  implicit side effect of editing a server card.

Retaining a review log alone therefore does not preserve the question, choice IDs
or explanation seen at answer time. The server needs immutable content references
before adding study history. Earlier payloads already overwritten upstream cannot
be reconstructed from the current material and are not invented by this design.

## First implementation

Allow the owner to update **only a plain-text explanation**, including explicitly
removing it. This is a representative card edit that does not change a question,
its answer, accepted/type-answer settings, grading semantics or scheduling. There
is no new UI in this slice. Existing previews display the current explanation.

Keep the upstream `QuestionRecord` JSON shape. Add `currentVersion` outside that
JSON, initially 1, and a separate version table keyed by owner, question ID and
version. Each stored version contains the complete QuestionRecord, its capture
time, a baseline/explanation label, and server-computed UTF-8 JSON byte length.
IDs, deck references, source keys/order, enabled flags, createdAt, importedAt and
sourceText/sourceHash remain intact. Original source fields describe the imported
source, not a promise that edited cards still exactly match it.

A new migration adds the column and an empty version table; it does not duplicate
all existing cards at deployment. Before its first edit, version 1 is read from
the unchanged current card as a virtual baseline with `recordedAt: null`. The
first edit stores that baseline and version 2 in the same transaction as the
current-card/deck update. Later edits append monotonically numbered versions.
The first captured baseline is the existing server record at this boundary, not
an assertion about earlier upstream states. A no-op creates no new version and
changes no timestamp/revision; stale requests are still rejected first.

The version API never updates or deletes existing snapshots. The only cascade
is the existing owner-account deletion flow. A migration downgrade refuses while
snapshots exist, rather than silently discarding them. With no snapshots, down
removes only the new empty table/column and leaves card JSON intact.

## Concurrency, visibility and bounds

All edits use #324's owner advisory lock and `expectedRevision` on the deck, so
metadata, archive and card edits participate in the same conflict check. The
snapshot inserts, current card, deck timestamp and deck revision commit together.
Archived cards may be edited without changing archive state. Ownership is derived
from the authenticated principal; foreign/missing deck, card and version IDs have
the same `NO_SUCH_MATERIAL` result.

Material show and version reads use a coherent database snapshot. Separate reads
of a deck revision and its cards must not return a mixture from before/after a
concurrent edit. Lists use descending version numbers and an exclusive `before`
cursor, at most 20 entries per page.

Initial bounds are 64 stored versions per card and 32 MiB of version JSON per
owner, including the baseline and current snapshot. Both initial inserts count.
These are explicit implementation limits, not upstream defaults. Every proposed
current material must still satisfy the existing 1 MiB/1,000-card limits. On a
limit or invalid input, reject the whole edit without partial snapshots or current
changes. Never prune old versions automatically; archive does not release budget.

## API boundary

All operations are POST endpoints under `fukushu/materials`:

| Endpoint | Input | Result / permission |
| --- | --- | --- |
| `update-card-explanation` | `id`, `questionId`, `expectedRevision`, `explanation: string or null` | deck management state and `version`; `write:account`, 5/min |
| `card-versions` | `id`, `questionId`, optional `before`, `limit` | current version and bounded version summaries; `read:account`, 60/min |
| `card-version` | `id`, `questionId`, `version` | one full QuestionRecord and version metadata; `read:account`, 60/min |

Only the declared explanation is passed to the write operation. Existing common
transport handling of unrelated input fields is preserved; caller-supplied owner,
answer, source keys and IDs cannot become edited fields. `MATERIAL_CONFLICT` is
409; `CARD_HISTORY_LIMIT` explicitly reports retained-history capacity exhaustion.
No authentication model, public route or public link is added.

## Required checks and next design

Regression checks cover exact baseline/new snapshots, owner separation, no-op and
null clearing, invalid Unicode/size, concurrent edits versus metadata/archive,
coherent reads, UTF-8/record-count/material-size limits and rollback, pagination,
restart/new-store reads, account cascade, migration round trips and guarded down.
Use the shared host validation lock, inspect processes/memory before acquiring it,
and mount existing dependencies read-only. No installation in another checkout.

Later work must make explicit choices before changing prompt/answer content:

1. Store immutable question-version references on new review logs, while preserving
   their original answers, rating, correct and FSRS log. Never regrade old reviews.
   `correct`, not percentage score, determines upstream automatic FSRS ratings.
2. Define scheduling continuity for changed answers and imported historical logs;
   do not copy upstream reset behavior implicitly or label unknown old payloads
   with a new version.
3. Restore content by appending a new version, not overwriting a saved version or
   rewinding the version counter. Capacity/export policy must preserve old data.
4. Add explicit source-replacement matching and conflict handling for manual edits,
   without equating changed fronts to an existing source key or replaying a backup
   over the server database. Media ownership and complete backup formats remain
   separate work.
