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

The source reader validates the complete archive before persistence. Reviews
use the target question, current state and global settings. An owner usage row
tracks total and non-history UTF-8 metadata, binary bytes, frame count, log count and
last position. The review transaction checks and updates these counters before
appending a log. Review history has no count ceiling. At the JSON or archive byte ceiling a new review fails atomically.
Existing study history remains exportable.

## API and ordinary-user input

- `fukushu/upstream/restore`: normal login only; owned `fileId`, new `requestId`,
  `confirmRestore: true`. Returns source SHA-256 and record count.
- `fukushu/upstream/restore-job`: the same authenticated confirmation, with an
  optional `statusOnly` query. The UI uses the existing database job queue for
  files over 8 MiB. Its job ID is scoped to the owner and request ID. The job
  stores only identifiers, size and Drive MD5. The persistent success receipt
  remains authoritative after the queue entry expires. Explicit retry after
  failure reads and validates the original again.
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

Cards render basic HTML and Markdown, text-node math, and selected Anki
typography in a scriptless frame. The original content and binary attachments
remain available in the upstream export.

For raster images and audio, the viewer calls `fukushu/upstream/media` with
the media ID and a byte offset. Each authenticated request checks the owner
and returns up to 1 MiB before base64 encoding, with the MIME type and total
byte length. Reading at or past the end returns an empty page. The client
checks the complete SHA-256 against the ID before displaying the attachment.
For multi-page files it gives decoded bytes to the browser to build a Blob and
revokes the object URL when the card closes. Playback and seeking start after
the download completes. The client respects the existing API rate limit.

For a GIFT deck, choose an owned UTF-8 .gift or .txt file (up to 256 KiB).
Preview the counts before applying. Source keys match existing IDs. Incompatible
answers or substantial prompt changes reset the current schedule as in the
pinned app. Missing questions are disabled; their history stays attached.
The owner transaction rejects a changed preview or a stale review. Empty
imports are refused. Direct updates from Anki text or a new APKG are pending.

## Collection size and old backups

Local and Drive inspection and queued source imports accept a framed binary
archive up to 1 GiB, with 64 MiB total JSON, 8 MiB per JSON frame, 8 MiB of non-history JSON, 20,000 frames excluding review history, one global
settings record, 100 decks and up to 10,000 records in each remaining material store.
Framing and the checksum also count toward the archive ceiling. Drive role,
instance, storage and downloader limits can be lower. The default role permits 30 MiB per file. Synchronous restore
accepts files up to 8 MiB. Source media and APKG bytes remain opaque. The
reader checks bounds before allocating each JSON frame and never inflates an
embedded archive.

The importer takes a private disk snapshot of the owned Drive original.
It checks the byte length and Drive MD5, hashes the complete original, validates
the envelope and media digests, and retains frame offsets, IDs and references for validation. It releases each validated history body before reading the next one.
Inside one PostgreSQL transaction it checks the owner, Drive identity, receipt
and collisions again, then re-reads the same snapshot to insert records and
attachments. Attachments above 8 MiB occupy permanent 256 KiB rows in
`fukushu_upstream_chunk`; smaller and existing inline attachments keep their
representation. An error rolls back records, chunks, usage and receipt together.
This design requires temporary space for one input and an uninterrupted
transaction during the database write. It needs no persistent import staging
or partial-row cleanup. Queue restart can repeat work from the original.

Export fetches up to 32 ordered record headers and JSON values at a time from a
transaction-local PostgreSQL cursor. It writes the original frame order and
256 KiB binary slices from the same repeatable-read snapshot into a temporary
file, then sends the completed file to Drive. A reader or writer failure
rolls back the transaction and releases the cursor. The page bounds the row
count; one large JSON value still needs to fit in memory. Export
requires free temporary space and Drive quota. The library list requests only material metadata; each selected deck retrieves a separate history page. Media preview reads either storage layout. Legacy API calls without an offset
retain the single-response 8 MiB limit. A GIFT update accepts up to 256 KiB of UTF-8 text and 1,000 incoming
questions. It reads the owner’s material JSON, checks the resulting relations
and accounts for the changed frames in the same transaction. Review bodies
and attachments stay in place. The preview expires after a concurrent edit or review. The native-v1
format keeps its independent limits.

The opt-in full-application HTTP test uses `FUKUSHU_SCALE_FIXTURE=1` in its
private run directory. From `packages/frontend`, create its input with
`node --import tsx ../features/games/fukushu/test/measure-local-inspection.mjs --fixture <run-directory>/scale.fukushu`.
This synthetic input has 5,000 questions and a 24 MiB attachment. The test
exercises ordinary Drive upload, racing job submissions, polling, review replay
and a checksummed Drive export. Its reported RSS samples the application PID
at 100 ms intervals and excludes the client, PostgreSQL and Redis.

### Long review histories

The queued importer and the local/Drive scanners accept combined JSON over
8 MiB when the excess comes from review history. The pilot bounds total JSON
at 64 MiB to bound import validation, transaction size and the duplicate-ID index. The existing
8 MiB non-history budget bounds the library response. Counters include the
actual UTF-8 frame wrapper. Restore rereads at most 100 consecutive frames
fitting in a 256 KiB window, or one larger frame, from the same private
snapshot inside one owner transaction. History may precede its question.
Duplicate IDs, incompatible references and late collisions reject the batch.

`upstream/show` with `page: {}` loads the material library. Supplying a deck
returns up to 20 newest logs and a continuation cursor ordered by UTC time
and record key. A page targets 256 KiB of stored answer data and includes one
oversized log on its own. The server also returns distinct cards reviewed in
the requested local study day so pagination cannot change the FSRS queue.
New imports and reviews maintain an owner/deck index and an exact deck count
in the source write transaction. Page selection reads up to 21 ordered keys.
Daily limits use distinct question keys in the requested time interval, including
reviews outside the visible page. The server still reads the bounded material
metadata; the day query can visit every entry in that interval.

On an existing installation the first deck request indexes that owner’s
pre-migration logs in batches of 32 under the owner transaction lock. A failed
transaction can be retried. Other users are indexed independently. Concurrent
deck requests and writes for the same owner serialize. Index fields are derived
from the original strings and are excluded from backup data. Legacy clients omitting `page` keep their full response
through 8 MiB and receive an explicit capacity error above it.

Review updates total and material usage with the state, new log and receipt.
The migration backfills material bytes without changing any learning records.
Downgrade refuses while older readers could not re-import an owner's history.
The deck history index migration can be reversed without modifying source frames.

In an isolated ordinary-user Drive and Chrome test, the pinned upstream writer
produced a 13,038,993-byte archive with 9,999 logs from a disposable IndexedDB.
The 9k user opened both history pages, recorded two answers and exported
10,001 logs. A fresh upstream IndexedDB restored the saved state, recorded
one further review, exported and restored again. All 10,001 prior logs matched.
Only the initial APKG/GIFT fixture is source-derived; the added history is
synthetic. See the [test harness](test/README.md).

The pinned app accepts legacy JSON versions 1–3, reconstructs missing source
metadata and repairs legacy APKG data for versions below 3. Direct JSON restore
in the 9k source UI is pending. To convert, restore into a *fresh, empty*
upstream browser profile, verify the cards and history there, then export a
binary .fukushu. Upstream restore replaces that profile's whole learning DB.
A converted file must still meet the 9k size and record limits.
See [upstream backup support](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/docs/backup-support.md).

Export preserves the stored source fields and binary payloads. JSON serialization
or record ordering can change the checksum of the complete file. The chunk
migration refuses a downgrade when an owner's collection exceeds the previous
reader's limits. The earlier store migration removes its tables on downgrade.
