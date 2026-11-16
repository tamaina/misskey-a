# Fukushu material persistence (pilot)

Refs #310. `fukushu/materials/create` and `fukushu/materials/show` store and return
the authenticated user's private material. Both are POST endpoints, using the
existing `write:account` and `read:account` permissions respectively. There is no
public material URL or other-user access. Missing and foreign IDs both return
`NO_SUCH_MATERIAL`. Ownership comes only from the authenticated principal.

This is a **create-only material API**, not a `.fukushu` backup restore or a Drive
import API. It preserves a bounded subset of the upstream `DeckRecord` and
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
