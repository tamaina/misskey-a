# Fukushu material persistence (pilot)

The owner-only study slice now adds flashcard self-ratings, FSRS schedules and
immutable review records. See [STUDY.md](STUDY.md) for the upstream mapping,
concurrency/retry protocol, capacity limits and the intentionally bounded UI.
The earlier sections below describe the material/import boundaries; previews
still never record a review. Existing browser history is not imported or reset.

Refs #310. `fukushu/materials/create` and `fukushu/materials/show` store and return
the authenticated user's private material. Both are POST endpoints, using the
existing `write:account` and `read:account` permissions respectively. There is no
public material URL or other-user access. Missing and foreign IDs both return
`NO_SUCH_MATERIAL`. Ownership comes only from the authenticated principal.

This is a bounded material API with metadata edits and recoverable archiving,
not a `.fukushu` backup restore. The Drive importer creates new decks; it never
replaces existing decks or their cards. It preserves a bounded subset of the upstream `DeckRecord` and
`QuestionRecord` formats from
[tamaina/fukushu, 0efee271](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/infrastructure/db/schema.ts).
The source IDs, card payload IDs, deck references, source keys, timestamps,
enabled flags and array order are kept unchanged. Card IDs are unique across
one owner's decks; identical IDs are allowed for different owners. The deck and
all cards are inserted in one transaction. Duplicates return `MATERIAL_EXISTS`
and never replace an existing card or partially save another deck.

The initial format is plain-text flashcards (`studyMode: flashcard`, source type
`gift` or `anki-text`). HTML, Anki packages/templates/media, other question kinds,
source references, history revisions and unknown record properties are rejected rather
than discarded. This is intentionally not a general upstream backup reader.
Plain text remains text even if it contains markup; a future UI must render it
as text, never as trusted HTML.

Limits: 1–1,000 cards and at most 1 MiB of UTF-8 JSON per material; 256-character
opaque source IDs; 16,384-character prompt/answer content. Each owner may create
100 materials, with an atomic quota across workers and a 5/minute create rate.
Archived materials count toward the same total quota: archiving does not reclaim
a slot. Permanent deletion and card replacement remain outside this pilot.
Account deletion cascades to the owner's new tables. Migration rollback drops
these tables and their data, so export before downgrading.

`games/fukushu` owns the new code, following #317's game-specific boundary without
moving existing game files or changing their DI identities. It is independent
of #313's grading core and does not call it. No grading result, numeric tolerance,
FSRS schedule, review history, backup or existing IndexedDB state is changed.

Follow-up: extend the bounded Drive importer to additional upstream formats through
explicit schemas; design source/media ownership, card replacement, permanent deletion and server
backup migration/merge with history preservation. Future FSRS integration must
derive automatic ratings from `correct`, not `score` (100 can still be incorrect).
Do not independently change the inherited decimal tolerance boundary or replay
existing history with new grading semantics.

## Material UI and Drive import

`/fukushu` (login required, linked from `/games`) lists the caller's decks and
shows plain-text cards, 20 at a time. Revealing an answer is a preview only: it
writes no grading, FSRS or review state. `fukushu/materials/list` requires
`read:account`, returns at most the existing owner quota of 100 decks in ID order,
and excludes source text. It returns active decks by default; `{archived: true}`
selects archived decks. `show` retains card records and ordering and adds
`revision` and nullable `archivedAt` outside the upstream material JSON.

Upload a source to Drive using the existing Drive UI, then choose that Drive file
in Fukushu. `fukushu/materials/import` accepts only `fileId`; both `write:account`
and `read:drive` are required for API tokens. The server checks the authenticated
owner before opening the file. Missing and foreign files both return
`NO_SUCH_FILE`. Local linked/remote files are not supported. Source limits:
128 KiB UTF-8, `.tsv` / `.csv` / `.txt`, 1–1,000 cards, two columns (front/back).
The text must explicitly declare `#html:false`; only Basic forward cards are
supported. Optional headers are `separator` (Tab/Comma), `deck`, `notetype:Basic`
and `columns` (two ordinary field names). Unknown/duplicate headers, special
columns, HTML/media/template/cloze syntax and duplicate fronts are rejected,
never silently converted or omitted. Quoted separators, escaped quotes and
multiline fields use the upstream delimited-text conventions; malformed quotes
are rejected rather than repaired.

```text
#separator:Tab
#html:false
#notetype:Basic
#deck:Geography
Capital of Japan?	Tokyo
Capital of France?	Paris
```

Use a real tab between each prompt and answer. IDs use upstream UUIDs;
`sourceKey` is SHA256 of `Basic` + NUL + front, followed by `:forward`. Original
UTF-8 text (including BOM) and its SHA256, source order, timestamps and Basic note
metadata are retained. Same-owner imports with the same source type and SHA256
are rejected atomically under the existing owner lock, including concurrent
requests or a retry after losing the response. Other owners can independently
import the same source. A changed source creates a new deck; it does not update
or merge an existing deck or its future history. There is no permanent deletion API.

Local originals use existing internal storage. Object-storage originals use the
**recorded URL** and the existing SSRF-aware DownloadService, with its redirect
checks/timeouts and an additional strict streaming byte bound. No current bucket
configuration is combined with an old key, and no S3 credentials are used. Size
and recorded MD5 must match before decoding/parsing. MD5 detects accidental
changes, not adversarial collision attacks; all content remains untrusted and
schema-validated. Unavailable, moved or changed originals fail without fallback
to a preview or a newly guessed storage location. Temporary downloads are removed
on success and failure. Server-wide size limits still apply if smaller.

This imports content reachable at an existing original URL; it does **not**
implement #319's authenticated S3 original-delivery design or create private S3
access. Drive source URL visibility is unchanged, as the UI explicitly states.
Stored material access is owner-only. No public sharing, APKG/GIFT import,
backup replacement, media, card replacement or study scheduling is added.

This slice builds on #321. Keep `games/fukushu` as its owner boundary when
composing with #317/#318: retain the `/fukushu` route/link, move the games landing
link to `games/index` with that PR, preserve every API operation, and regenerate
the combined SDK/OpenAPI expectations. Do not replace the games provider or DI
identities with Fukushu's provider.


## Metadata changes and recoverable archive

`fukushu/materials/update` changes only the deck name (1–256 characters), optional
description (up to 4,096 characters), and deck `updatedAt`. Omitting `description`
removes that optional field; the UI submits an empty string to clear its text.
`fukushu/materials/archive` accepts an explicit `archived` boolean. Both require
`write:account`, the material `id` and `expectedRevision`; each has the existing
5/minute write limit. Missing and foreign IDs return the same 404.

The owner advisory lock serializes create/update/archive across workers. A stale
revision returns `MATERIAL_CONFLICT` (409) without writing. Every accepted
mutation increments the integer revision; clients must reload after a conflict
or uncertain response before deciding to retry. The UI preserves edit drafts,
shows the newly loaded server metadata separately, and requires another explicit
save. It never automatically retries a rejected mutation.

Archive/restore change only management columns, retaining the exact deck JSON,
cards, source text/hash, imported time, IDs and source keys. Archived materials
remain accessible to their owner through `show`, remain in source deduplication,
and can be restored from the archived list. No public visibility changes.
The metadata update also retains all those fields except name/description and
deck `updatedAt`; the full stored material must still satisfy the 1 MiB bound.

This differs deliberately from upstream `deckRepository.remove`, which deletes
cards, study states, review logs and import records, and from source replacement,
which can reset scheduling for incompatible answers. Neither behavior is copied.
The current server slice has no FSRS/review tables, so retention tests prove card
and source identity, not migration of upstream study history. Future source
replacement needs versioned card payloads and an explicit history migration plan.

The management migration adds columns with active/revision-1 defaults to existing
decks. Its `down` preserves deck/card JSON but discards archive/revision state;
reapplying it makes every retained deck active at revision 1. The earlier material
migration still drops its tables when reverted. These are development migrations,
not a backup/restore procedure.

See [the real-application test notes](test/README.md) for isolated authentication,
Drive upload, ownership, metadata conflict and archive/restore checks.


## Card-content version pilot

See [the card-version design](CARD-VERSIONS.md) for upstream compatibility,
retention rules and the boundary with future study history. The first slice lets
the owner update a plain-text explanation and inspect saved content versions.
Prompt, answer, original IDs/source and scheduling are unchanged. An edit retains
the original card before replacing its current explanation; no prior version is
automatically pruned, restored over another version, or regraded. Existing material
JSON remains in the upstream record shape; version metadata is outside it.
