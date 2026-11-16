# Fukushu material persistence (pilot)

Refs #310. `fukushu/materials/create` and `fukushu/materials/show` store and return
the authenticated user's private material. Both are POST endpoints, using the
existing `write:account` and `read:account` permissions respectively. There is no
public material URL or other-user access. Missing and foreign IDs both return
`NO_SUCH_MATERIAL`. Ownership comes only from the authenticated principal.

This is a **create-only material API**, not a `.fukushu` backup restore.
The UI and bounded Drive importer described below add a way to create new decks;
they never replace or update existing decks. It preserves a bounded subset of the upstream `DeckRecord` and
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
This pilot has no update/delete API: the quota cannot be reclaimed through it.
Those operations need an explicit history-preserving design before expansion.
Account deletion cascades to the owner's new tables. Migration rollback drops
these tables and their data, so export before downgrading.

`games/fukushu` owns the new code, following #317's game-specific boundary without
moving existing game files or changing their DI identities. It is independent
of #313's grading core and does not call it. No grading result, numeric tolerance,
FSRS schedule, review history, backup or existing IndexedDB state is changed.

Follow-up: support additional upstream formats and Drive-backed import through
explicit schemas; design source/media ownership, updates, deletion and server
backup migration/merge with history preservation. Future FSRS integration must
derive automatic ratings from `correct`, not `score` (100 can still be incorrect).
Do not independently change the inherited decimal tolerance boundary or replay
existing history with new grading semantics.

## Material UI and Drive import

`/fukushu` (login required, linked from `/games`) lists the caller's decks and
shows plain-text cards, 20 at a time. Revealing an answer is a preview only: it
writes no grading, FSRS or review state. `fukushu/materials/list` requires
`read:account`, returns at most the existing owner quota of 100 decks in ID order,
and excludes source text. `show` retains the original records and ordering.

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
or merge an existing deck or its future history. There is still no deletion API.

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
backup replacement, media, update/delete or study scheduling is added.

This slice builds on #321. Keep `games/fukushu` as its owner boundary when
composing with #317/#318: retain the `/fukushu` route/link, move the games landing
link to `games/index` with that PR, preserve every API operation, and regenerate
the combined SDK/OpenAPI expectations. Do not replace the games provider or DI
identities with Fukushu's provider.
