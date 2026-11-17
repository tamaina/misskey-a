# Upstream compatibility pilot (Issue #310)

This is a small, unregistered in-memory adapter and a real-browser compatibility
contract. It is **not a server migration, public API, user-facing import or a new
backup format**. The next step is an owner-scoped persistent adapter; do not wire
this session directly into an endpoint.

The source of truth is tamaina/fukushu at
`0efee271a13f15096beb8cbaaea25092c5927b29`, including its normal update/review
operations and its existing `FUKUSHU-BACKUP-1` output. Native v1 remains unchanged.
#334 remains an inspector. #338's base64 v2 experiment is not required or adopted;
only its independent lossless reader/projection split is reused here.

## Contract established in this slice

- Keep original ReviewLog IDs/values, current StudyState, settings, cards, source
  metadata, media and APKG bytes. No conversion to native UUID history, replay of
  old reviews, invented prior cards, prior scheduler settings or before/after.
- Source `anki:` history IDs are ordinary valid upstream values. Imported reps
  and saved log count do not determine a 9k operation revision.
- Advance from the **current** card with ts-fsrs 5.4.1 and the source's current
  desiredRetention, with fuzz disabled as upstream does. Record shape and answer
  fields follow upstream `recordReview`; grading/`ratingFromResult` is unchanged.
- Export unchanged input byte-for-byte. After new reviews, write original upstream
  framing and SHA, preserving all untouched record values and binary payloads.
  JSON whitespace/key ordering is not promised after editing. Schema defaults
  are only a validation view, never written back into untouched source records.
- New review request UUIDs are separate from imported history IDs. Concurrent
  retry in one session returns the same receipt, stale/conflicting writes fail,
  and size/validation failures publish no partial update. After reopening an
  export, an existing request/log ID is rejected rather than applied twice.

The current session stores retry receipts and optimistic counters in memory only.
A persistent adapter must store receipts and updates atomically under the owner
lock. It must preserve imported source records without requiring native history
versions or continuous native before/after chains. Current native v1 serializers
must not silently drop these records. A record-level extension/separate export
route can be evaluated then; a raw-database copy or base64 whole-archive v2 is not
an inevitable requirement.

## Evidence and reproducibility

`test/upstream-browser/run.mjs` bundles **unmodified pinned upstream modules**,
checks their Git HEAD/clean tracked state, uses an isolated Chrome context and real
IndexedDB, and selects `official-21b.apkg` through a normal file input. The browser
runs with `chromiumSandbox: true`; no extension permissions, profile sharing or
sandbox disabling are needed. Bundling finishes before Chrome starts. Only a
loopback server holding the test bundle/WASM is exposed during the test.

The upstream official fixture was exported with `anki==25.9`; its generation
script and provenance are in upstream `packages/anki-import/tests/fixtures/README.md`.
No personal collection or actual user data is used. The scenario:

1. Imports the valid official 21b APKG through `previewApkg` (real worker and SQLite
   WASM), `prepareApkg`, `applyApkg`: 9 cards, 36 real source-generated `anki:` logs.
2. Imports synthetic named GIFT, reviews it once, then changes TRUE to FALSE via
   upstream `previewGift`/`updateDeck`: reps 1 → 0 with one original review retained.
3. Exports/restores/re-exports with upstream `createBackupArchive`/`restoreBackupFile`:
   byte-identical archive. This proves the reset/log mismatch is source-reachable.
4. Opens that output in the 9k adapter, preserving all 37 existing logs and current
   retention 0.87. Reviews the reset card (0 → 1) and an APKG card (4 → 5); states
   and ReviewLog values match actual upstream `recordReview` (apart from fresh ID).
5. Restores the adapter output into upstream IndexedDB, reviews again (reset card
   1 → 2), and re-exports: 40 logs. Reopening retains all original log values,
   cards, metadata and settings. Unit tests additionally compare raw APKG/media
   bytes, retries, races, input isolation, size rollback and default omission.

The checked-in `test/backend/fixtures/actual-upstream/` contains the generated
100,407-byte archive, SHA/provenance and expected continuation results. UUIDs and
creation timestamps are source-generated, so regeneration creates a new fixture
hash; semantic assertions are repeatable. This replaces reliance on hand-picked
`reps=7/logs=1` or `source-review-1` examples, which were synthetic arbitrary values,
not observed user data or a proved normal source path.

For optional regeneration, provide an unchanged pinned upstream checkout and a
**separate** dependency prefix, without installing into any shared checkout:

```
FUKUSHU_UPSTREAM=/absolute/pinned/upstream
FUKUSHU_BROWSER_DEPS=/absolute/private/dependency-prefix
FUKUSHU_BROWSER_OUTPUT=/absolute/private/output
ESBUILD_MODULE=/absolute/esbuild/lib/main.js
PLAYWRIGHT_MODULE=/absolute/playwright/index.mjs
node packages/features/games/fukushu/test/upstream-browser/run.mjs
```

Export those environment variables. The prefix's package.json/dependencies use
upstream lock versions: idb 8.0.3, valibot 1.4.2, sql.js 1.14.1, fflate 0.8.3,
fzstd 0.1.1, protobufjs 8.7.2, hash-wasm 4.12.0, ts-fsrs 5.4.1, dompurify 3.4.12,
css-tree 3.2.1. This run used esbuild 0.28.2, Playwright 1.64.1 and Chrome
157.0.8103.78. Existing browser/dependency installations are read-only; generated
output and the temporary browser context are disposable. On the shared development
host, hold `/tmp/misskey-9k-integration-validation.lock` and inspect all host jobs
and memory first. This optional browser generator is not run by ordinary unit CI;
unit CI consumes the committed source-generated fixture.

## Limits and next small stage

This proves the specified official-21b + GIFT-reset scenario, not all Fukushu
formats/data. Legacy JSON, other APKG variants, all quiz grading/rendering, large
collections, cross-version schedulers, full original Vue UI and Misskey authenticated
import/DB/UI are not established by this pilot. HTML/media safety is not implied
by format/hash correctness. The 8 MiB / 20,000-record inspector bound is retained,
not asserted to be an upstream limit or justification for silent data loss.

Next: owner-scoped persistence for original-shaped current states and imported
logs, explicit historical fields as unknown/not applicable, all-ID collision
rejection and one transaction, durable review receipts, export completeness and
restart/retry tests in an isolated DB. Existing native-v1 restoration must retain
its semantics. Decide that small schema/API diff before enabling it. Ordinary
user binary Drive policy and the distinction between local inspection and import
authorization remain unchanged. No merge/deploy or existing user-data writes.
