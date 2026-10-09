# Explicit object contract cohorts

Native finite inputs use public Valibot object entries. Native finite response
objects use strictObject so unexpected output properties are detected, rather
than silently stripped. HTTP continues to run the existing AJV validator against
original input objects and returns original responses without native parsing.
HTTP extra-key acceptance has not changed.

## Completed notes cohort

The notes/state pilot is documented in notes-state-contract-pilot.md. The next
bounded cohort retires three looseObject calls and two resultObject calls from
notes/contract/endpoint-definitions.ts, removing that file's helper import.

| Endpoint | Declared input | Actual response evidence | Optionality/defaults |
| --- | --- | --- | --- |
| notes/drafts/count | Empty object | Actual repository query returns a number, author-filtered by authenticated user | No input defaults; scalar output is required |
| notes/show-partial-bulk | noteIds string array, 1–100 valid IDs | Actual NoteEntityService.fetchDiffs emits exactly id/reactions/reactionEmojis after visibility filtering and reaction buffering | All three item fields required; reaction maps explicitly allow string keys with number/string values; no null/default branches |
| notes/translate | Required noteId and targetLang strings | Actual handler projects provider response to exactly sourceLang/text | Output root remains optional: empty note text returns undefined; null is rejected; no input defaults |

Negative native tests cover missing/wrong-type/extra object properties and typed
record values. Actual serializer tests exercise both buffering branches and
visibility filtering; translation tests exercise free/pro provider selection and
empty-text return. Provider-only response fields are not copied into the result.
The inspected producers expose no undocumented string-key response fields.

HTTP tests separately retain original unknown input keys and unparsed extra
response properties. AJV errors, array bounds, required fields and unknown input
policy remain the same. Output JSON Schema gains additionalProperties: false
on each finite object; translate's optional root is retained. SDK regeneration,
18 runtime tests and tsd pass, with no generated SDK or API-report diff.

## Remaining inventory

Feature production source (excluding feature test trees and *.test sources):

| Kind | After pilot | After this cohort |
| --- | --- | --- |
| looseObject calls | 342 | 339 |
| resultObject calls | 263 | 261 |

The broader enforcement inventory covers repository-owned TS/JS source under
packages, including historical tests and type references. It shrinks from 705
to 700 known references (415 looseObject, 285 resultObject). This is a different
scope and metric from production call counts above.

Run `pnpm check:contract-object-inventory` to check the recorded inventory. After
retiring references, run `pnpm check:contract-object-inventory --write`; writing
only permits a subset of the existing fingerprints and counts. Source
fingerprints include the file, declaring owner and complete reference/call
text, so relocation or edits to retained legacy sites need deliberate review,
rather than silently granting new allowed uses. Comments and ordinary strings
do not count. Named imports, literal property keys, local aliases, casts,
parentheses, destructuring, local object members and lexical shadowing are
covered. This does not claim to evaluate arbitrary computed JavaScript keys.

Maintenance CI checks the exact current inventory and a shrinking baseline from
HEAD^ with checkout depth 2. New call/reference fingerprints or increased counts
fail. The first inventory is initialized at this checkpoint; later commits may
only shrink it. The guard has seven regression tests. Remove result-object.ts
once its last real consumer and historical test consumer have been retired.

## Separate difficult shapes

These remain unconverted; no alternative loose wrapper or type cast is added.

| Shape | Current concrete evidence | Evidence needed before closing |
| --- | --- | --- |
| QueueJob | operations/contract/packed.ts declares id/name/timestamps/status plus dynamic data and opts; progress is number/string/boolean/unknown array/open object; returnValue is unknown | Enumerate actual producer job kinds and payloads, BullMQ options and progress/return values; define discriminated job unions and a justified JSON-value boundary |
| PageBlock | pages/contract/page-block.ts has text/image/note/section variants plus eleven persisted deprecated types, optional recursive children and a stored-extra fallback | Inspect stored block writers/readers and supported legacy fields; prove finite variants and recursive child compatibility before removing the fallback |
| Registry JSON | preferences remaining contracts expose unconstrained get/get-all and get-detail { updatedAt, value: unknown }; scope defaults and required-list metadata are explicit | Verify persistence/serializer value domain and real scalar/array/object branches; justify a recursive JSON-value union and typed key record instead of closing to an empty object |
| User composition | users packedMeDetailed intersects three lazy complete branches; packedUserDetailedNotMe intersects two; fields are spread across companion schemas | Flatten the complete sibling entries before closing; verify actual serializers, nullable/optional/default differences and role-specific branches so strict branches do not reject each other's fields |

The resultObject helper remains while these and other documented consumers exist.
This cohort does not declare the full retirement complete.
