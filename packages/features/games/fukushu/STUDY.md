# Private flashcard study: first vertical slice

Refs #326 / #310; builds on #325. Design recorded before implementation. This slice
adds owner-only flashcard review and history; it does not import, reset, replay,
replace or regrade existing upstream browser histories.

## Upstream compatibility

Reference commit: `tamaina/fukushu@0efee271a13f15096beb8cbaaea25092c5927b29`:

- [StudyView](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/views/StudyView.vue)
  reveals a flashcard before self-rating Again / Hard / Good / Easy. `typeAnswer`
  requires nonblank input before reveal, but does not automatically compare
  acceptedAnswer. Flashcard logs store `responseText: ''` and
  `correct: rating !== 'again'`. This slice follows that behavior.
- [study.ts](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/application/study.ts)
  snapshots the queue at session start, due reviews first then up to 20 new cards.
  Again advances to the next queued card; it is not immediately reinserted.
  The default is no daily review cap. The 20-new-card setting is a queue bound,
  not a guaranteed total daily limit in the upstream implementation. New cards
  use question-ID order. Unlike upstream, this first slice does not automatically
  switch an empty queue to early-review cram mode; it shows that nothing is due.
- [adapter](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/infrastructure/fsrs/adapter.ts)
  and lockfile use ts-fsrs 5.4.1. Retention 0.9 and fuzz false are initial values.
  Preserve its stored Card/ReviewLog field mapping, including the fields it
  omits; do not silently migrate existing records to another scheduler version.
- [schema](https://github.com/tamaina/fukushu/blob/0efee271a13f15096beb8cbaaea25092c5927b29/packages/app/src/infrastructure/db/schema.ts)
  defines StudyStateRecord and ReviewLogRecord. The server stores those shapes,
  plus explicit relational owner/version/concurrency metadata outside their JSON.

Quiz grading is outside this flashcard slice. Future quiz automatic ratings must
use `correct`, not percentage score. No inherited grading boundary is changed.

## Transaction and history model

Add a study-state table keyed by owner/question, with upstream state JSON and a
monotonic revision. Existing cards have a virtual empty state at revision 0;
the initial empty card uses the question creation timestamp. Import/create do
not bulk-create states or modify material JSON. State is persisted on first review.
Future-dated creation records are retained and excluded until their time arrives;
they are not silently rewritten. A clock earlier than a saved review/state time
rejects another review rather than producing a negative elapsed interval.

Append-only review rows are keyed by owner/client UUID request ID. They retain
the upstream review record, exact before/after FSRS cards, scheduler version,
retention/fuzz parameters, questionVersion and resulting stateRevision. The
question-version foreign key pins the content actually reviewed. History reads
include that saved question record, never a substitute from the current card.

All writes share the owner advisory lock used by material edits. A review first
checks its durable request ID: an identical request returns the same committed
result without rescheduling; reuse with different inputs returns STUDY_CONFLICT.
For a new request, require matching questionVersion and expectedStateRevision,
an active deck and enabled card, and no future-due reviewed card. Time and FSRS
outputs are server-owned. No client-supplied grade, schedule or timestamp is used.

Before a first review of version 1, materialize its baseline atomically with the
state and log. Explanation edits must detect an already captured baseline, not
insert version 1 twice. Version reads must return its real recordedAt. A failed
review leaves no baseline, state or log behind. A later explanation edit retains
state/history; a stale queued card returns a conflict rather than recording a
different explanation than the one displayed.

New review records are capped at 10,000 rows and 32 MiB JSON per owner. Current
and archived decks both count. At capacity reject the entire write and retain
all prior records. Baseline capture also obeys #325's 32 MiB version budget.
Never prune history automatically. Request-ID retries remain usable at capacity.
The study migration downgrade refuses while state/history rows exist. Account
deletion follows the existing owner cascade; no study/history deletion API exists.

## API and UI boundary

All are authenticated POST endpoints, reusing account read/write scopes:

| Request name | Input | Output |
| --- | --- | --- |
| `fukushu/study/queue` | `{id: deckId}` | `{deckId, serverTime, items: [{question, questionVersion, stateRevision, isNew, due}]}` |
| `fukushu/study/review` | `{id: deckId, questionId, questionVersion, expectedStateRevision, requestId: UUID, rating, durationMs}` | `{id: requestId, questionVersion, stateRevision, record: ReviewLogRecord, card: StoredFsrsCard}` |
| `fukushu/study/history` | `{id: deckId, beforeId?: UUID, limit?: 1..20}` | array of review results with `question: saved QuestionRecord` |

Queue/history use read:account, 60/min; review uses write:account, 60/min.
History is newest-first, ordered by reviewedAt then UUID, with an exclusive
owner/deck-scoped beforeId cursor. Foreign/missing identities return the same
NO_SUCH_MATERIAL. Archived history remains readable; archived study is unavailable.
STUDY_CONFLICT is 409; STUDY_LIMIT is 400; STUDY_UNAVAILABLE is 409.
Duration is bounded to 0..86,400,000 ms and never affects scheduling.

The existing material page gains an explicit study panel, separate from previews.
It captures one queue, reveals plain text, offers the four ratings, displays the
saved next due date and retained history. Typed answers are ephemeral as upstream.
Disable duplicate clicks. For an uncertain network result retain the exact UUID
and payload and allow an explicit retry; never generate a new review identity
for the same pending action. Definite conflicts require reloading the queue.
Do not advance the queue before success. Leaving an unfinished session does not
write a review. Date storage is UTC; presentation uses the browser's local time.

## Verification and follow-up

Test owner isolation, missing/archived/disabled/future-due cards, empty states,
all four ratings against pinned upstream fixtures, state CAS, identical and
conflicting retries, concurrent tabs, explanation-edit races, baseline capture,
capacity rollback, historical snapshots, cursor bounds and migration parity/down.
Exercise real auth/Drive/study persistence in an owned full-app E2E and inspect
the UI in development-machine Chrome. Serialize all heavy work under the common
host lock, checking processes/memory first; dependencies stay isolated.

Future work: review settings, all-deck sessions, quiz formats, source replacement,
history-preserving backup merge/import and scheduler upgrades need explicit
compatibility decisions. Do not infer old question versions absent from upstream
backups, replay old reviews, or automatically reset FSRS after content edits.

## Daily review reminders

Open **Review reminders** on the material list to opt in, select a local time and
time zone, and save. Each device must also have an active Misskey Web Push
subscription. The reminder setting is per account. It uses the signed-in owner
session for both `fukushu/reminder/show` and `fukushu/reminder/update`. Sending
`{ "schedule": null }` disables the schedule and cancels pending retries.

The system queue checks every minute. A reminder needs at least one enabled,
previously studied card due for ordinary review in an active native deck or
imported library. A DST gap moves the scheduled time forward by the gap and a
repeated hour uses its later occurrence. After downtime, only the current day's
slot can be delivered, within one hour of its scheduled time.

PostgreSQL commits the daily claim and pending send together. A worker reserves
the send for five minutes, checks eligibility again and uses the owner's current
subscriptions. A transient failure or a worker restart allows retry until expiry.
A request already submitted to a push provider may arrive after opt-out. The
service worker checks that the recipient account is saved locally, uses an
account/occurrence notification tag, and records the last displayed occurrence.
A retry after display normally stays silent, including after a worker restart.
A crash between display and recording it can repeat the notification if the
user has already dismissed it. Local storage removal also resets this record.
Notifications carry no material names, questions, answers or review counts.
