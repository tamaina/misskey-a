# Source-compatible owner persistence (Issue #310)

This follow-up to #339 connects the pinned upstream binary format to an owner
store, authenticated API, continued review and the existing Misskey export queue.
It does not adopt the experimental base64 v2 format from #338. Native v1 backup,
native history and the inspection-only endpoint keep their existing behavior.
Open **Decks from Fukushu** on `/fukushu` to import from your Drive, browse decks and review cards.

## Contract and representation

The compatibility reference is tamaina/fukushu
`0efee271a13f15096beb8cbaaea25092c5927b29`, including actual APKG import and
`updateDeck` retaining history while resetting the current study card. Source
IDs, ReviewLog fields, current StudyState, settings and binary bytes are retained.
No UUID conversion, inferred historical question version, fabricated prior card,
regrading, or equality between history count/reps/revision is required.

Two tables are added. `fukushu_upstream_record` stores the original frame JSON as
text, optional binary bytes, original order, original-file SHA-256 lineage,
and an independent optimistic revision for current study states. Its owner/store/
SHA-256-of-JSON-ID key accommodates the upstream string IDs without truncation;
the actual ID remains in the JSON. Newly appended reviews retain the baseline
source hash as lineage, not a claim that those logs existed in the input; their
operation receipts identify the new server-side review. Text preserves escaped NUL/surrogates as well
as ordinary source IDs. An absent blob and a zero-length blob remain distinct.
`fukushu_operation_receipt` stores a new operation UUID, canonical request and
result, keyed by owner. New request UUIDs do not constrain imported history IDs.

All imports and reviews take the same owner advisory transaction lock as native
creation/restoration. An import rejects every source ID collision in the same
store, including native deck/question/history IDs; different owners can retain
identical IDs. Native insert triggers prevent the inverse race. Existing content
is never overwritten or merged. A second snapshot normally conflicts on its
global settings ID; incremental merge/update is deliberately outside this slice.

Import reads only an owned, local-origin Drive original through the existing
bounded reader. Inside the transaction it rechecks ownership, file type/origin,
size and MD5 while holding a share lock on the Drive row. Original records,
blobs and the receipt commit together. SHA-256 checks integrity, not authorship.
Receipt failure rolls back all rows. An interrupted transaction can be retried;
a committed request returns its saved result even after the input is deleted.
Reusing that request UUID with different input fails. PostgreSQL crash recovery
provides transaction durability; process-kill/power-loss injection is not tested.

Reviews use the source-compatible scheduler adapter, current desired retention,
server time, explicit rating, correctness and answers. They atomically update
only the current card, append one source-shaped log and save the receipt. Stale
revisions and changed retries fail; repeated identical requests return the first
result without advancing again. This revision is independent of source reps and
historical log count. Suspended/disabled/unsupported cards are not reviewed.
Historical card snapshots absent in the source remain unknown.

The bounded source snapshot is validated before writes and before review commits.
Existing inspection limits remain: 8 MiB total (including framing/checksum),
20,000 frames, exactly one settings record, 100 decks, 1,000 questions/states and
10,000 per other store. No base64 expansion or limit increase is introduced.
Larger archives, older JSON backups, arbitrary past versions and missing-settings
fallback are not covered. Hitting a size/count limit prevents a new write without
changing existing history; it must be addressed before claiming general migration.

## API and ordinary-user input

- `fukushu/upstream/restore`: normal login only; owned `fileId`, new `requestId`,
  `confirmRestore: true`. Returns source SHA-256 and record count.
- `fukushu/upstream/show`: `read:account`; source records and current local
  revisions for the authenticated owner. JSON is the validated view (schema
  defaults may be visible); retained source JSON and binaries are not replaced.
- `fukushu/upstream/review`: `write:account`; new `requestId`, source `questionId`,
  `expectedRevision`, rating/correct/answers/duration. Owner/time come from server.
- `fukushu/upstream/export`: normal login only and
  `acknowledgeDriveVisibility: true`; queues a `.fukushu` snapshot in Drive and
  sends the existing `exportCompleted` notification. The source framing is reused.

A bounded Drive detector recognizes only a checksum-valid `.fukushu` envelope
as `application/x-fukushu-backup`. That specific MIME is added to the **default**
upload allowlist; arbitrary `application/octet-stream` remains disallowed.
Administrators' custom role allowlists remain authoritative. Import performs the
full source schema/relation/media validation independently; MIME recognition is
not authorization and does not certify content safety. The safe serving MIME
list is unchanged, so this format is delivered as octet-stream. Existing public
Drive URLs are not made private. Local inspection remains client-only and grants
no import permission. The existing inspector's `canImport: false` remains about
that inspection endpoint, not an automatic import action.

## Verification and remaining work

Tests use only disposable accounts/DBs and generated fixtures, never a user's
archive. `actual-upstream.fukushu` comes from #339's unchanged upstream modules,
real Chrome IndexedDB and the official valid `official-21b.apkg` fixture: 36 real
Anki-import log IDs, plus one synthetic GIFT review retained by an actual material
reset. The arbitrary earlier `reps=7`/one-log fixture is not real user evidence.

The PostgreSQL suite compares every source frame/binary before and after
persistence, checks owner separation, both-direction native collisions,
concurrent retries, service recreation, stale revisions, late import/review
rollback, Drive changes between read and commit, and escaped synthetic IDs.
HTTP coverage uses real password authentication, ordinary-user Drive upload,
corruption rejection, owner-only import/show/review, continued reset-card study,
original history preservation and the actual queue/Drive export. Native v1
export/restore and study cases run in the same fresh application.

The browser harness optionally takes `FUKUSHU_PERSISTED_EXPORT` and
`FUKUSHU_PERSISTED_STATE` from that isolated HTTP test, restores through the pinned
upstream's real IndexedDB, continues study and checks re-exported history/media.
Use the common validation lock and host process check before the harness; do not
run it against a user's browser context or disable Chrome sandbox protections.
See the PR for exact completed results and the final head's CI.

## Using imported decks

The deck view reads the authenticated owner's source records. Normal study uses
the source's 4 am local rollover, daily limits, due ordering and reset history.
Cram includes active cards outside the due queue. Quiz grading retains the
separate score and correct flag. Flashcards use self-assessment. An unconfirmed
save retries its original request ID and revision. Read the current card in the
deck view and the historical result in the review list.

Images and audio in supported formats are fetched by the owner's media ID.
The renderer supports basic HTML, ruby, lists, tables, raster images and audio.
External assets, custom Anki CSS/scripts and active templates do not run here.
Markdown and math source remain readable as text. The original content, CSS,
package and binary media remain available in the upstream export.

For a GIFT deck, choose an owned UTF-8 .gift or .txt file (up to 256 KiB).
Preview the counts before applying. Source keys match existing IDs. Incompatible
answers or substantial prompt changes reset the current schedule as in the
pinned app. Missing questions are disabled; their history stays attached.
The owner transaction rejects a changed preview or a stale review. Empty
imports are refused. Direct updates from Anki text or a new APKG are pending.

## Collection size and old backups

The pinned app streams the binary archive and allows JSON metadata frames up to
64 MiB. 9k's current adapter reconstructs a bounded archive for review, update
and export. Its whole-file limit is 8 MiB, including media and the original
APKG, with separate limits of 100 decks, 1,000 questions, 1,000 study states
and 20,000 total frames. When a new review would exceed a limit it rolls back.
Handling large collections requires incremental reads/writes and a streaming
export. Raising just the upload limit would leave later reviews unable to save.

The pinned app accepts legacy JSON versions 1–3, reconstructs missing source
metadata and repairs legacy APKG data for versions below 3. Direct JSON restore
in the 9k source UI is pending. To convert, restore into a *fresh, empty*
upstream browser profile, verify the cards and history there, then export a
binary .fukushu. Upstream restore replaces that profile's whole learning DB.
A converted file must still meet the 9k size and record limits.
See [upstream backup support](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/docs/backup-support.md).

 Export preserves source
values and binaries, not a promise that JSON serialization/order is byte-identical
to the original whole input after DB persistence. Migration rollback drops these
new tables; do not run `down` on populated production data. No merge/deployment
or real-user migration is part of this work.
