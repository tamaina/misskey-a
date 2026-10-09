# notes/state explicit contract pilot

This pilot changes only the native notes/state input and output schemas. The
handler, endpoint route, repositories, authentication metadata, and HTTP/AJV
transport remain unchanged. Broader conversion waits for design review of this
checkpoint.

## Inferred types

The TypeScript compiler reports the following types for both InferInput and
InferOutput of each schema (without casts or patched Valibot internals):

| Schema | Before | After |
| --- | --- | --- |
| Input | `{ noteId: string } & { [key: string]: unknown }` | `{ noteId: string }` |
| Output | `{ isFavorited: boolean; isMutedThread: boolean } & object` | `{ isFavorited: boolean; isMutedThread: boolean }` |

Input uses public `v.object({ noteId: misskeyId })`. Output uses public
`v.strictObject` with both boolean entries. No new loose wrapper is introduced.

## Native parsing and legacy HTTP

| Case | Native input | Native output |
| --- | --- | --- |
| Complete valid object | Accept | Accept |
| Missing required property | Reject | Reject |
| Wrong property type | Reject | Reject |
| Extra property | Accept; strip extra property | Reject |

The input has no defaults. Invalid note IDs are rejected in both native parsing
and HTTP. The actual handler still emits exactly the two booleans by comparing
repository counts to zero, preserving the existing note.threadId ?? note.id
thread fallback and both take: 1 queries.

The HTTP transport validates the original input with AJV, accepts unknown input
keys, and passes that same object to the handler. Native object parsing is not
invoked by HTTP. Authentication user/token arguments remain separate from the
endpoint contract. The existing INVALID_PARAM code, UUID
`3d81ceae-475f-4600-b2a8-2bc116157532`, schemaPath, and reason are tested for
missing, wrong-type, and malformed-ID inputs.

HTTP responses retain their original object identity and unknown response keys;
no global response parsing is enabled. A response with an extra property is
returned unchanged by the HTTP transport and rejected by native strict parsing.

## JSON Schema and generated SDK

Input JSON Schema remains the same open object:

```json
{"type":"object","properties":{"noteId":{"type":"string","format":"misskey:id"}},"required":["noteId"]}
```

Output JSON Schema and OpenAPI response schema are now explicitly closed:

```json
{"type":"object","properties":{"isFavorited":{"type":"boolean"},"isMutedThread":{"type":"boolean"}},"required":["isFavorited","isMutedThread"],"additionalProperties":false}
```

The sole intended documentation/schema change is additionalProperties: false
on the output. SDK regeneration, 18 runtime tests, and tsd pass. Generated SDK artifacts and
the API report have no diff; the public legacy HTTP transport remains unparsed.

Regression evidence lives in
`packages/features/notes/test/backend/notes-state-contract.test.ts` and the
backend-owned contract-endpoint tests. No feature-specific config or package is
introduced.
