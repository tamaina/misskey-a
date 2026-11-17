# Lossless backup codec design pilot

Refs #310. Depends on #334. This is an internal experiment, **not a published
backup format, import feature, or persistence authorization**. No API, queue,
DB, native study or account-settings integration registers the codec. Native
v1 export/restore remains unchanged. The inspection response stays unchanged.

`readUpstreamArchive` snapshots bytes before asynchronous hashing. It validates
the existing bounded upstream format and retains the exact original, all raw
JSON values and both media/import-source binary frames. Accessors return copies.
The schema-normalized view is separate: defaults such as `studyMode` and
`checkpointInterval` are never inserted into the original. Inspection is a
redacted projection and remains `canImport: false`.

The experimental envelope uses `misskey-fukushu-backup-pilot`, version 2 and an
explicit `experimental: true` marker. Its payload holds the original binary as
canonical base64, the SHA-256 of the whole source file, and the distinct embedded
SHA-256 of its pre-trailer payload. An outer SHA-256 covers the serialized JSON
payload. Decode verifies all three, strict fields, UTF-8, base64 and the upstream
framing/records/media checks. Hashes establish integrity, not authorship or
authorization. The codec does not infer historical cards, FSRS states or settings.

The existing 8 MiB cap applies to the **complete envelope**. Base64 expands data
by roughly 4/3; an inspectable 8 MiB source does not fit this envelope. Both an
early base64 lower bound and the actual final byte count are checked. No limits
are increased, records trimmed or blobs omitted to make an archive fit.

Tests use the pinned upstream writer fixture, including opaque synthetic source
archive bytes (not a valid APKG), media, sparse history and omitted defaults.
They verify byte-exact round trips, snapshot isolation, corruption/unknown-field
rejection, size boundaries and unchanged native v1 behavior. This does not
establish a real IndexedDB/APKG application round trip.

Before any persistence/API work, review the final format identifier/version,
batch provenance and restore receipt model, ID collision rules and storage
quotas, plus the binary storage boundary. This pilot intentionally does not
finalize those choices. Ordinary-user binary Drive policy is unchanged; local
inspection is never evidence of server-side import permission. The remaining
design is in `UPSTREAM-IMPORT.md` and requires the next review.
