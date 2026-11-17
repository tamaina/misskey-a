# Non-destructive deck backup pilot

Refs #310; depends on #328. Design recorded before implementation.

This document describes the #330 export/inspection pilot. The subsequent
[atomic native restore](RESTORE.md) adds conflict-free insertion without changing
this file format or enabling upstream full-database replacement.

## Scope and existing convention

Misskey's notes export uses a secure authenticated request, a database queue job,
a temporary file, DriveService.addFile, and an exportCompleted notification.
This pilot uses that path for one selected Fukushu deck, including archived decks.
A separate Drive-file inspection request validates the snapshot and reports ID
collisions without inserting, replacing, pruning, or scheduling any study data.
There is no restore/apply endpoint in this pilot.

Export is restricted to normal login sessions using the existing `secure` policy,
not third-party API tokens. Import inspection also requires a normal login and
checks ownership of the selected local Drive original before reading it. The
client cannot supply an owner, URL, object-store key, or filesystem path.

Drive ownership does not make the file's download URL private. The export control
explains that the file contains material and review history and that a person
with its URL may download it. Existing Drive storage/delivery rules are retained;
this feature does not introduce public links, access keys, or a new privacy model.

## Upstream compatibility

Reference: tamaina/fukushu@0efee271a13f15096beb8cbaaea25092c5927b29:
[backup format](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/docs/backup-support.md),
[validation and replacement](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/backup.ts),
[archive records](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/backupArchive.ts).

- Current `.fukushu` starts with `FUKUSHU-BACKUP-1\n`, contains length-prefixed
  store records and optional raw media/source binaries, and ends in a SHA-256
  checksum. Upstream validates references and binaries before replacing every
  IndexedDB store in one transaction.
- Legacy JSON versions 1–3 use `gift-fsrs-learning-backup`. They contain settings,
  decks, questions, studyStates and reviewLogs, plus optional source/media/import
  records. The current binary format avoids Base64 expansion for attachments.
- Neither format contains 9k's immutable question versions, before/after cards,
  server state revisions or idempotent request payloads. Old review logs do not
  prove which historical question content was shown. Do not invent that evidence
  from today's question, or replay old answers through the scheduler.

The pilot uses a distinct `misskey-fukushu-deck-backup` JSON envelope, version 1,
with a SHA-256 checksum of the UTF-8 JSON payload. It is NOT named `.fukushu` and
is not claimed to be directly restorable by the upstream app. Its inner original
Deck/Question/StudyState/ReviewLog records retain their shapes and values; server
metadata is separate. Known upstream archive/JSON formats are explicitly rejected
by the native inspector, without writing or silently dropping unsupported data.
Checksum verification detects accidental corruption, not trusted authorship.

## Consistent and bounded snapshot

Use a single PostgreSQL REPEATABLE READ transaction, reading only the authenticated
owner's selected deck. Capture the deck revision/archive flag, current questions
and their positions/versions, every saved question version, study states and all
review rows for that deck. Include all before/after cards, scheduler parameters,
review request identities and timestamps. Never manufacture virtual states or
baselines on export. Exclude owner/account IDs, tokens and unrelated Drive files.

This first bounded JSON pilot has an 8 MiB file limit. Before materializing rows,
measure decompressed JSON text plus a conservative per-row metadata allowance in
the same transaction; enforce record-count bounds. Recheck the final serialized
size. Reject a large snapshot as a whole; never truncate history or produce a
partial file. A streaming archive for larger decks is a separate follow-up.
Release the snapshot transaction before uploading to Drive. Always clean up the
owned temporary file on success or failure. Emit completion only after Drive save.

## Inspection and future restore

Read the owner's recorded original using the existing local/object-store path,
bounded bytes, original byte-size/MD5 consistency, and shared SSRF-safe downloader.
Validate UTF-8, format/version/checksum, strict schemas, uniqueness, deck/card IDs,
positions, version chains and references, review/state revision continuity and
before/after links. Validate stored values; do not rerun grading or FSRS.
Unknown fields, scheduler versions, broken references or omitted records fail.

Return only metadata/counts and collisions with the current owner's deck, question
and review IDs. The result explicitly says that no data was restored. Collision
checks are a snapshot, not a reservation or permission to apply later.

A future restore must revalidate inside a transaction and choose an explicit
policy: empty destination or conflict-free insertion first; never implicit replace
or merge. Preserve upstream records whose exact historical card content is unknown
with truthful provenance instead of fabricating version snapshots. Media/APKG,
settings, quiz, cross-owner mapping and full-account restore remain unimplemented.

### Follow-up import boundary

| Source data | Preserve | Decision before apply support |
| --- | --- | --- |
| Native 9k snapshot | All original IDs, current and saved question versions, before/after state, request UUID and scheduler parameters | Conflict-free insertion only in one owner-scoped transaction; collisions fail as a whole, with no silent remapping or upsert |
| Upstream studyStates | Saved due, stability, difficulty, repetitions, suspension/bury flags and timestamps | Keep the saved state directly; never derive it by replaying review logs |
| Upstream reviewLogs | Original IDs, rating, correct, response, FSRS log, duration and optional Anki origin | Add explicit imported provenance and unavailable historical-question evidence; do not attach current question text as if it were the reviewed version |
| Upstream deck/questions and attachments | Stable deck/question/source identities, source APKG and media references | Validate all referenced sources/media before writing; reject unsupported records together rather than stripping them |

A native restore cannot be authorized merely by this inspection result. Re-read
and validate the original bytes, limits and all collisions at apply time, then
insert the entire selected deck atomically under the existing owner lock. Repeated
imports must detect existing IDs instead of duplicating history. No replace/merge,
owner-wide clear, regrading or scheduler reset is part of the initial policy.
Upstream history may use non-UUID IDs and lack 9k's request/revision chain; accepting
it through the native schema would silently misrepresent that data. A separate
imported-history representation is needed before upstream apply can be implemented.

## Verification

Test consistent export during concurrent review/edit, owner isolation, archived
records, exact data/ordering round trips, all schema/reference/checksum failures,
size/count bounds, collisions and no database changes after inspection. Cover
Drive original validation, failures and notification ordering. Exercise real
PostgreSQL, queue/Drive/API wiring and the actual Chrome UI in an isolated instance.
All heavy checks share the host validation lock; existing dependencies stay read-only.

The PostgreSQL regression suites are opt-in through `FUKUSHU_TEST_SOCKET`, using
an owned disposable PostgreSQL server on Unix socket port 55474 with user
`fukushu` and database `postgres`. They create/drop only their dedicated test
schemas and must not be pointed at a shared or production database. The full
application HTTP regression is separately opt-in through `FUKUSHU_E2E_RUN_DIR`
and checks its private directory, owner marker, loopback URL and isolated DB/
Redis configuration before using synthetic accounts. Neither opt-in test should
be represented as having run merely because the default CI suite passed.
