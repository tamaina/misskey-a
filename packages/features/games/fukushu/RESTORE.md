# Atomic native deck restore

Refs #310; depends on #330. Design recorded before implementation.

## Boundary

Restore one `misskey-fukushu-deck-backup` JSON v1 file owned by the normal logged-in
user in Drive. The 8 MiB, 1,000 question, 20,000 version and 10,000 review file
limits remain. Upstream `.fukushu`, legacy JSON, media/APKG, settings, merge,
replacement and ID remapping are unsupported. Never infer historical question
contents, regrade answers, replay FSRS, or reset due dates.

Inspection is advisory. Restore always reads the owned original again and checks
UTF-8, bytes, MD5, SHA-256, strict schemas and every version/history reference.
The client supplies only the Drive file ID and explicit confirmation, never an
owner or decoded payload. Third-party API tokens remain denied by secure policy.

## Transaction and races

Use the existing `fukushu:create:<owner>` advisory transaction lock shared with
material creation, edits and study recording, under READ COMMITTED so a waiting
transaction sees the preceding commit. Revalidate the captured bytes inside the
transaction. Lock the Drive record FOR SHARE and recheck ownership, local-original
status, size and MD5 before any insert; a deleted, reassigned or changed original
fails. The lock prevents a concurrent Drive row deletion/change during insertion.

Reject every deck, question or review ID collision in the destination owner's
namespace as a whole, including archived decks, questions belonging to another
deck and review request UUIDs. Existing other-owner IDs remain independent. No
upsert, delete, overwrite, skip-conflicts or partial success is allowed. Unique
constraints remain the last line of defense and cause a full rollback.

Check the existing owner quotas while holding the same lock: 100 decks including
archived ones, 64 versions per card, 32 MiB saved question-version JSON, and
10,000 / 32 MiB review rows. Recompute server byte accounting from restored JSON,
using the same formula as current writers. Refuse the complete backup if it does
not fit; never trim history to make it fit.

Insert deck, current questions, saved versions, study states and reviews in FK
order, in bounded batches within one transaction. Preserve original IDs, revisions,
positions, timestamps, archived state, scheduler parameters and request payloads.
Do not materialize virtual baseline versions or new-card study states. Any error
rolls back all five tables. A retry after an uncertain successful response rejects
the now-existing IDs instead of duplicating history; the UI asks the user to check
the library/history rather than automatically retrying.

## UI and validation

The backup panel requires a fresh successful inspection with no reported conflicts
and an explicit restore confirmation. Changing the selected file clears inspection
and confirmation. Server checks remain authoritative if data changes afterwards.
After success reload the library, preserve the archive flag and show completion. This
does not make a Drive download URL private or prove the backup's authorship.

Use only disposable PostgreSQL/Redis and synthetic accounts/files: verify exact
export/restore/export payload equality except export time, version/history API
results and idempotent review retries; archived/virtual state; each ID collision;
all quotas; malformed/unsupported input; foreign/missing/changed Drive originals;
concurrent restore/create; forced late failure rollback; and actual authenticated
HTTP/Drive plus Chrome flow. All host-heavy checks share the global validation
lock and check host processes/memory first. No live data, merge or deployment.

## API

`POST /api/fukushu/backup/restore` accepts `{ fileId, confirmRestore: true }` under
normal login only. Success returns `restored: true`, `deckId`, `archived`, and the
inserted question/version/state/review counts. `BACKUP_CONFLICT` is HTTP 409;
`BACKUP_LIMIT` is HTTP 400. Missing/foreign originals are indistinguishable 404.
The body cannot select another owner, provide a URL or bypass the bounded reader.
This bounded first slice is synchronous, like the existing Drive material import;
there is no background partial import and no restore operation on export jobs.
