# Non-destructive deck backup pilot

Refs #310; depends on #328. Design recorded before implementation.

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

Reference: tamaina/fukushu@0efee271a13f15096beb8cbaaea25092c5927b29,
`docs/backup-support.md`, `application/backup.ts`, `backupArchive.ts`, and DB schema.

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

## Verification

Test consistent export during concurrent review/edit, owner isolation, archived
records, exact data/ordering round trips, all schema/reference/checksum failures,
size/count bounds, collisions and no database changes after inspection. Cover
Drive original validation, failures and notification ordering. Exercise real
PostgreSQL, queue/Drive/API wiring and the actual Chrome UI in an isolated instance.
All heavy checks share the host validation lock; existing dependencies stay read-only.
