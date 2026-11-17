# Upstream backup import boundary

Refs #310. Depends on #332. Design recorded before implementation.

## Evidence

Pinned upstream: `tamaina/fukushu@0efee271a13f15096beb8cbaaea25092c5927b29`.
[`application/backupArchive.ts`](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/backupArchive.ts) writes `FUKUSHU-BACKUP-1\n`, little-endian uint32
JSON lengths, strict store/value metadata and optional raw binary, followed by
64 lowercase ASCII hex bytes of SHA-256 over everything before the checksum.
There is no archive export timestamp or application commit in the binary header.
[`backup.ts`](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/backup.ts) validates records/references, then replaces eight IndexedDB stores
in one transaction. That replacement policy must not be carried into 9k.

`ReviewLogRecord` retains rating/correct, answers, duration and `fsrsLog`, but no
historical question snapshot/version, scheduler retention/fuzz/version, request
UUID semantics, or full before/after card. [`HistoryView.vue`](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/views/HistoryView.vue) resolves the current
question for its label. `StudyStateRecord` is a current state, not proof of the
state after any particular historical review. Settings are also current values.
Never use them to invent missing historical facts, replay FSRS, or regrade answers.

## First implementation

Inspect a user-selected local file entirely in browser memory, or read an
authenticated owner's Drive original using the existing bounded reader. Both
paths use the same portable parser; the local path uses Web Crypto SHA-256 and
the Drive path uses Node SHA-256. Support the binary version above only, up to 8 MiB and bounded
record counts. Validate framing, checksum, UTF-8, pinned record schemas, unique
IDs and references, and media size/hash. Unknown formats/fields and malformed
archives fail as a whole. Legacy JSON v1–3, large archives and actual database
import remain outside this first slice. HTML/CSS/SVG/APKG are not rendered or
executed. Checksum integrity does not authenticate authorship or prove safe media.

Expose counts and a bounded history sample explicitly marked
`questionSnapshot: unavailable`, with no fabricated question/card/version.
The UI states that inspection did not import or overwrite anything. It never
passes upstream data to the native restore endpoint. No migrations, mutable
settings, active schedules or existing records are changed in this slice.

## Non-destructive persistence design for the next slice

Introduce a separately tagged imported-history representation preserving the
original record and source archive digest, owner and upstream format. Unknown
historical question/before/after/scheduler fields remain null/unknown, not the
current question or a reconstructed FSRS result. Existing native review records
keep their stronger invariants. Preserve source IDs, current state, suspension,
sourceRemoved, buriedUntil, import records, settings and media references without
turning settings into historical scheduler evidence.

Before enabling writes, extend the native export/restore format to preserve this
provenance and unknown fields; v1 cannot truthfully express imported history.
Use a new version rather than silently weakening v1. Then add owner-scoped
collision checks across all intended writes, quotas and one transaction under the
existing owner lock. No overwrite, partial import, ID remapping, trimming or
regrading. On any unsupported component, reject the whole import and retain the
source. Binary/media storage requires its own failure/cleanup boundary before
APKG imports can be enabled. Review this representation as a small follow-up
before extending to full upstream migration.

## Supported inspection limits and evidence

The pilot accepts at most 8 MiB and 20,000 total records: exactly one settings
record, at most 100 decks, 1,000 questions, 1,000 study states, and 10,000 each of
reviews, import sources, media and import operations. The total limit can reject
an archive even if every per-store limit passes. Requiring a settings record is
stricter than the upstream reader's fallback; missing settings are not fabricated.
Missing source order is reported, not normalized. The response returns counts and
the newest 20 history summaries, not question bodies, answers or raw media.

The binary fixture and provenance in `test/backend/fixtures` were produced by the
unchanged pinned upstream writer using synthetic cursor/hash adapters. It includes
all eight stores, current cards updated after two reviews, a current FSRS state
with more repetitions than saved logs, SVG bytes and synthetic archive bytes.
This establishes writer framing/schema compatibility for these cases, not a full
upstream browser export/restore round trip or valid APKG/media import. No real
user archive has been read or changed. Older JSON, arbitrary historical writer
versions and production-sized collections remain unverified.

The normal-login-only `fukushu/backup/inspect-upstream` endpoint checks ownership
before opening the Drive original, reuses original size/MD5/storage handling, and
has no database write or queue dependency. It cannot call native restore. The
checksum is an integrity check, not authentication of an archive's author.

## Drive upload policy limitation

The actual Drive uploader classifies this binary format as
`application/octet-stream`. The default ordinary-user policy rejects it; existing
moderator/admin exemptions allow it. This pilot does not expand that policy,
mislabel the file as text, or add a feature-specific upload bypass. The Drive path is usable
only when the account can already store the original under its existing policy.
The real HTTP check asserts ordinary-user rejection and then exercises inspection
with a synthetic administrator's own upload; Chrome uses that same account.
Making server-side upstream migration available to every default-policy user
needs a separate explicit file-type/permission design. The inspector itself still checks ownership
and does not grant administrators access to another owner's Drive file.

## Ordinary-user input choice

The default-policy upload denial was reproduced through actual HTTP. A dedicated
MIME detector plus a new default upload permission would expand server storage
policy and require a separate review of file serving and MIME spoofing. A new
multipart import endpoint would create another server upload boundary (body limits,
rate limits, temporary storage and cleanup). Neither is necessary for inspection.

The small ordinary-user path therefore uses a native local-file chooser and
`File.arrayBuffer()` only after checking the 8 MiB cap and `.fukushu` extension.
It runs the same framing/schema/reference/media-integrity checks in memory and
waits for Web Crypto hashes before showing a report. It sends no file or result
to the server, writes no Drive/IndexedDB/localStorage data, and has no automatic
network fallback. Web Crypto must be available (HTTPS or trusted localhost).
Malformed/unsupported files fail with no partial report. Native restore and
actual upstream persistence remain separate, unimplemented for this format.

Tests cover the upstream-writer fixture through Web Crypto, corruption and early
size rejection, no network/storage calls, and UI handling without Drive/API use.
The real ordinary-account Chrome check with the synthetic fixture is pending
after a storage-pressure pause. Local tests passed; final frontend typecheck
was interrupted by the user-requested pause, and rebuild/E2E have not run for
this local-file addition. This does not establish real upstream IndexedDB/APKG round-trip
compatibility, historical card reconstruction or actual migration success.
