# Upstream backup import boundary

Refs #310. Depends on #332. Design recorded before implementation.

## Evidence

Pinned upstream: `tamaina/fukushu@0efee271a13f15096beb8cbaaea25092c5927b29`.
`application/backupArchive.ts` writes `FUKUSHU-BACKUP-1\n`, little-endian uint32
JSON lengths, strict store/value metadata and optional raw binary, followed by
64 lowercase ASCII hex bytes of SHA-256 over everything before the checksum.
There is no archive export timestamp or application commit in the binary header.
`backup.ts` validates records/references, then replaces eight IndexedDB stores
in one transaction. That replacement policy must not be carried into 9k.

`ReviewLogRecord` retains rating/correct, answers, duration and `fsrsLog`, but no
historical question snapshot/version, scheduler retention/fuzz/version, request
UUID semantics, or full before/after card. `HistoryView.vue` resolves the current
question for its label. `StudyStateRecord` is a current state, not proof of the
state after any particular historical review. Settings are also current values.
Never use them to invent missing historical facts, replay FSRS, or regrade answers.

## First implementation

Read and inspect an authenticated owner's Drive original, using the existing
bounded reader. Support the binary version above only, up to 8 MiB and bounded
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
