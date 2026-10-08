/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import type { Config } from '@/config.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';
import { endpoints as documentedEndpoints } from '@features/index/backend/endpoints.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
import type { Packed } from '@features/index/contract/packed.js';
import { noteDraftEndpointDefinitions as definitions } from '@features/notes/contract/draft-endpoint-definitions.js';
import { MAX_NOTE_TEXT_LENGTH } from '@features/notes/contract/note-text-limit.js';
import { MAX_NOTE_TEXT_LENGTH as backendPublicLimit } from '@features/notes/contract/note-text-limit.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@features/notes/backend/constants.js';
import baseline from '../../../test/fixtures/draft-contract-baseline.json' with { type: 'json' };

const frozenInputs = {
  "notes/drafts/create": {
    "type": "object",
    "properties": {
      "visibility": {
        "type": "string",
        "enum": [
          "public",
          "home",
          "followers",
          "specified"
        ],
        "default": "public"
      },
      "visibleUserIds": {
        "type": "array",
        "uniqueItems": true,
        "items": {
          "type": "string",
          "format": "misskey:id"
        }
      },
      "cw": {
        "type": "string",
        "nullable": true,
        "minLength": 1,
        "maxLength": 100
      },
      "hashtag": {
        "type": "string",
        "nullable": true,
        "maxLength": 200
      },
      "localOnly": {
        "type": "boolean",
        "default": false
      },
      "reactionAcceptance": {
        "type": "string",
        "nullable": true,
        "enum": [
          null,
          "likeOnly",
          "likeOnlyForRemote",
          "nonSensitiveOnly",
          "nonSensitiveOnlyForLocalLikeOnlyForRemote"
        ],
        "default": null
      },
      "replyId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "renoteId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "channelId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "text": {
        "type": "string",
        "minLength": 0,
        "maxLength": 3000,
        "nullable": true
      },
      "fileIds": {
        "type": "array",
        "uniqueItems": true,
        "minItems": 0,
        "maxItems": 16,
        "items": {
          "type": "string",
          "format": "misskey:id"
        }
      },
      "poll": {
        "type": "object",
        "nullable": true,
        "properties": {
          "choices": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 0,
            "maxItems": 10,
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 50
            }
          },
          "multiple": {
            "type": "boolean"
          },
          "expiresAt": {
            "type": "integer",
            "nullable": true
          },
          "expiredAfter": {
            "type": "integer",
            "nullable": true,
            "minimum": 1
          }
        },
        "required": [
          "choices"
        ]
      },
      "scheduledAt": {
        "type": "integer",
        "nullable": true
      },
      "isActuallyScheduled": {
        "type": "boolean",
        "default": false
      }
    },
    "required": []
  },
  "notes/drafts/update": {
    "type": "object",
    "properties": {
      "draftId": {
        "type": "string",
        "nullable": false,
        "format": "misskey:id"
      },
      "visibility": {
        "type": "string",
        "enum": [
          "public",
          "home",
          "followers",
          "specified"
        ]
      },
      "visibleUserIds": {
        "type": "array",
        "uniqueItems": true,
        "items": {
          "type": "string",
          "format": "misskey:id"
        }
      },
      "cw": {
        "type": "string",
        "nullable": true,
        "minLength": 1,
        "maxLength": 100
      },
      "hashtag": {
        "type": "string",
        "nullable": true,
        "maxLength": 200
      },
      "localOnly": {
        "type": "boolean"
      },
      "reactionAcceptance": {
        "type": "string",
        "nullable": true,
        "enum": [
          null,
          "likeOnly",
          "likeOnlyForRemote",
          "nonSensitiveOnly",
          "nonSensitiveOnlyForLocalLikeOnlyForRemote"
        ]
      },
      "replyId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "renoteId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "channelId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "text": {
        "type": "string",
        "minLength": 0,
        "maxLength": 3000,
        "nullable": true
      },
      "fileIds": {
        "type": "array",
        "uniqueItems": true,
        "minItems": 0,
        "maxItems": 16,
        "items": {
          "type": "string",
          "format": "misskey:id"
        }
      },
      "poll": {
        "type": "object",
        "nullable": true,
        "properties": {
          "choices": {
            "type": "array",
            "uniqueItems": true,
            "minItems": 0,
            "maxItems": 10,
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 50
            }
          },
          "multiple": {
            "type": "boolean"
          },
          "expiresAt": {
            "type": "integer",
            "nullable": true
          },
          "expiredAfter": {
            "type": "integer",
            "nullable": true,
            "minimum": 1
          }
        },
        "required": [
          "choices"
        ]
      },
      "scheduledAt": {
        "type": "integer",
        "nullable": true
      },
      "isActuallyScheduled": {
        "type": "boolean"
      }
    },
    "required": [
      "draftId"
    ]
  }
} as const;
const frozenMetas = {
  "notes/drafts/create": {
    "tags": [
      "notes",
      "drafts"
    ],
    "requireCredential": true,
    "prohibitMoved": true,
    "kind": "write:account",
    "res": {
      "type": "object",
      "optional": false,
      "nullable": false,
      "properties": {
        "createdDraft": {
          "type": "object",
          "optional": false,
          "nullable": false,
          "ref": "NoteDraft"
        }
      }
    },
    "errors": {
      "noSuchRenoteTarget": {
        "message": "No such renote target.",
        "code": "NO_SUCH_RENOTE_TARGET",
        "id": "b5c90186-4ab0-49c8-9bba-a1f76c282ba4"
      },
      "cannotReRenote": {
        "message": "You can not Renote a pure Renote.",
        "code": "CANNOT_RENOTE_TO_A_PURE_RENOTE",
        "id": "fd4cc33e-2a37-48dd-99cc-9b806eb2031a"
      },
      "cannotRenoteDueToVisibility": {
        "message": "You can not Renote due to target visibility.",
        "code": "CANNOT_RENOTE_DUE_TO_VISIBILITY",
        "id": "be9529e9-fe72-4de0-ae43-0b363c4938af"
      },
      "noSuchReplyTarget": {
        "message": "No such reply target.",
        "code": "NO_SUCH_REPLY_TARGET",
        "id": "749ee0f6-d3da-459a-bf02-282e2da4292c"
      },
      "cannotReplyToInvisibleNote": {
        "message": "You cannot reply to an invisible Note.",
        "code": "CANNOT_REPLY_TO_AN_INVISIBLE_NOTE",
        "id": "b98980fa-3780-406c-a935-b6d0eeee10d1"
      },
      "cannotReplyToPureRenote": {
        "message": "You can not reply to a pure Renote.",
        "code": "CANNOT_REPLY_TO_A_PURE_RENOTE",
        "id": "3ac74a84-8fd5-4bb0-870f-01804f82ce15"
      },
      "cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility": {
        "message": "You cannot reply to a specified visibility note with extended visibility.",
        "code": "CANNOT_REPLY_TO_SPECIFIED_VISIBILITY_NOTE_WITH_EXTENDED_VISIBILITY",
        "id": "ed940410-535c-4d5e-bfa3-af798671e93c"
      },
      "cannotCreateAlreadyExpiredPoll": {
        "message": "Poll is already expired.",
        "code": "CANNOT_CREATE_ALREADY_EXPIRED_POLL",
        "id": "04da457d-b083-4055-9082-955525eda5a5"
      },
      "noSuchChannel": {
        "message": "No such channel.",
        "code": "NO_SUCH_CHANNEL",
        "id": "b1653923-5453-4edc-b786-7c4f39bb0bbb"
      },
      "youHaveBeenBlocked": {
        "message": "You have been blocked by this user.",
        "code": "YOU_HAVE_BEEN_BLOCKED",
        "id": "b390d7e1-8a5e-46ed-b625-06271cafd3d3"
      },
      "noSuchFile": {
        "message": "Some files are not found.",
        "code": "NO_SUCH_FILE",
        "id": "b6992544-63e7-67f0-fa7f-32444b1b5306"
      },
      "cannotRenoteOutsideOfChannel": {
        "message": "Cannot renote outside of channel.",
        "code": "CANNOT_RENOTE_OUTSIDE_OF_CHANNEL",
        "id": "33510210-8452-094c-6227-4a6c05d99f00"
      },
      "containsProhibitedWords": {
        "message": "Cannot post because it contains prohibited words.",
        "code": "CONTAINS_PROHIBITED_WORDS",
        "id": "aa6e01d3-a85c-669d-758a-76aab43af334"
      },
      "containsTooManyMentions": {
        "message": "Cannot post because it exceeds the allowed number of mentions.",
        "code": "CONTAINS_TOO_MANY_MENTIONS",
        "id": "4de0363a-3046-481b-9b0f-feff3e211025"
      },
      "tooManyDrafts": {
        "message": "You cannot create drafts any more.",
        "code": "TOO_MANY_DRAFTS",
        "id": "9ee33bbe-fde3-4c71-9b51-e50492c6b9c8"
      },
      "tooManyScheduledNotes": {
        "message": "You cannot create scheduled notes any more.",
        "code": "TOO_MANY_SCHEDULED_NOTES",
        "id": "22ae69eb-09e3-4541-a850-773cfa45e693"
      },
      "cannotRenoteToExternal": {
        "message": "Cannot Renote to External.",
        "code": "CANNOT_RENOTE_TO_EXTERNAL",
        "id": "ed1952ac-2d26-4957-8b30-2deda76bedf7"
      },
      "scheduledAtRequired": {
        "message": "scheduledAt is required when isActuallyScheduled is true.",
        "code": "SCHEDULED_AT_REQUIRED",
        "id": "15e28a55-e74c-4d65-89b7-8880cdaaa87d"
      },
      "scheduledAtMustBeInFuture": {
        "message": "scheduledAt must be in the future.",
        "code": "SCHEDULED_AT_MUST_BE_IN_FUTURE",
        "id": "e4bed6c9-017e-4934-aed0-01c22cc60ec1"
      }
    },
    "limit": {
      "duration": 3600000,
      "max": 300
    }
  },
  "notes/drafts/update": {
    "tags": [
      "notes",
      "drafts"
    ],
    "requireCredential": true,
    "prohibitMoved": true,
    "kind": "write:account",
    "res": {
      "type": "object",
      "optional": false,
      "nullable": false,
      "properties": {
        "updatedDraft": {
          "type": "object",
          "optional": false,
          "nullable": false,
          "ref": "NoteDraft"
        }
      }
    },
    "errors": {
      "noSuchRenoteTarget": {
        "message": "No such renote target.",
        "code": "NO_SUCH_RENOTE_TARGET",
        "id": "b5c90186-4ab0-49c8-9bba-a1f76c282ba4"
      },
      "cannotReRenote": {
        "message": "You can not Renote a pure Renote.",
        "code": "CANNOT_RENOTE_TO_A_PURE_RENOTE",
        "id": "fd4cc33e-2a37-48dd-99cc-9b806eb2031a"
      },
      "cannotRenoteDueToVisibility": {
        "message": "You can not Renote due to target visibility.",
        "code": "CANNOT_RENOTE_DUE_TO_VISIBILITY",
        "id": "be9529e9-fe72-4de0-ae43-0b363c4938af"
      },
      "noSuchReplyTarget": {
        "message": "No such reply target.",
        "code": "NO_SUCH_REPLY_TARGET",
        "id": "749ee0f6-d3da-459a-bf02-282e2da4292c"
      },
      "cannotReplyToInvisibleNote": {
        "message": "You cannot reply to an invisible Note.",
        "code": "CANNOT_REPLY_TO_AN_INVISIBLE_NOTE",
        "id": "b98980fa-3780-406c-a935-b6d0eeee10d1"
      },
      "cannotReplyToPureRenote": {
        "message": "You can not reply to a pure Renote.",
        "code": "CANNOT_REPLY_TO_A_PURE_RENOTE",
        "id": "3ac74a84-8fd5-4bb0-870f-01804f82ce15"
      },
      "cannotReplyToSpecifiedNoteWithExtendedVisibility": {
        "message": "You cannot reply to a specified visibility note with extended visibility.",
        "code": "CANNOT_REPLY_TO_SPECIFIED_NOTE_WITH_EXTENDED_VISIBILITY",
        "id": "ed940410-535c-4d5e-bfa3-af798671e93c"
      },
      "cannotCreateAlreadyExpiredPoll": {
        "message": "Poll is already expired.",
        "code": "CANNOT_CREATE_ALREADY_EXPIRED_POLL",
        "id": "04da457d-b083-4055-9082-955525eda5a5"
      },
      "noSuchChannel": {
        "message": "No such channel.",
        "code": "NO_SUCH_CHANNEL",
        "id": "b1653923-5453-4edc-b786-7c4f39bb0bbb"
      },
      "youHaveBeenBlocked": {
        "message": "You have been blocked by this user.",
        "code": "YOU_HAVE_BEEN_BLOCKED",
        "id": "b390d7e1-8a5e-46ed-b625-06271cafd3d3"
      },
      "noSuchFile": {
        "message": "Some files are not found.",
        "code": "NO_SUCH_FILE",
        "id": "b6992544-63e7-67f0-fa7f-32444b1b5306"
      },
      "cannotRenoteOutsideOfChannel": {
        "message": "Cannot renote outside of channel.",
        "code": "CANNOT_RENOTE_OUTSIDE_OF_CHANNEL",
        "id": "33510210-8452-094c-6227-4a6c05d99f00"
      },
      "containsProhibitedWords": {
        "message": "Cannot post because it contains prohibited words.",
        "code": "CONTAINS_PROHIBITED_WORDS",
        "id": "aa6e01d3-a85c-669d-758a-76aab43af334"
      },
      "containsTooManyMentions": {
        "message": "Cannot post because it exceeds the allowed number of mentions.",
        "code": "CONTAINS_TOO_MANY_MENTIONS",
        "id": "4de0363a-3046-481b-9b0f-feff3e211025"
      },
      "noSuchNoteDraft": {
        "message": "No such note draft.",
        "code": "NO_SUCH_NOTE_DRAFT",
        "id": "49cd6b9d-848e-41ee-b0b9-adaca711a6b1"
      },
      "accessDenied": {
        "message": "Access denied.",
        "code": "ACCESS_DENIED",
        "id": "56f35758-7dd5-468b-8439-5d6fb8ec9b8e"
      },
      "noSuchRenote": {
        "message": "No such renote.",
        "code": "NO_SUCH_RENOTE",
        "id": "64929870-2540-4d11-af41-3b484d78c956"
      },
      "cannotRenote": {
        "message": "Cannot renote.",
        "code": "CANNOT_RENOTE",
        "id": "76cc5583-5a14-4ad3-8717-0298507e32db"
      },
      "cannotRenoteToExternal": {
        "message": "Cannot Renote to External.",
        "code": "CANNOT_RENOTE_TO_EXTERNAL",
        "id": "ed1952ac-2d26-4957-8b30-2deda76bedf7"
      },
      "noSuchReply": {
        "message": "No such reply.",
        "code": "NO_SUCH_REPLY",
        "id": "c4721841-22fc-4bb7-ad3d-897ef1d375b5"
      },
      "cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility": {
        "message": "You cannot reply to a specified visibility note with extended visibility.",
        "code": "CANNOT_REPLY_TO_SPECIFIED_VISIBILITY_NOTE_WITH_EXTENDED_VISIBILITY",
        "id": "215dbc76-336c-4d2a-9605-95766ba7dab0"
      },
      "tooManyScheduledNotes": {
        "message": "You cannot create scheduled notes any more.",
        "code": "TOO_MANY_SCHEDULED_NOTES",
        "id": "02f5df79-08ae-4a33-8524-f1503c8f6212"
      },
      "scheduledAtRequired": {
        "message": "scheduledAt is required when isActuallyScheduled is true.",
        "code": "SCHEDULED_AT_REQUIRED",
        "id": "fe9737d5-cc41-498c-af9d-149207307530"
      },
      "scheduledAtMustBeInFuture": {
        "message": "scheduledAt must be in the future.",
        "code": "SCHEDULED_AT_MUST_BE_IN_FUTURE",
        "id": "ed1a6673-d0d1-4364-aaae-9bf3f139cbc5"
      }
    },
    "limit": {
      "duration": 3600000,
      "max": 300
    }
  }
} as const;

vi.mock('@features/index/backend/endpoints.js', () => ({ endpoints: [] }));
const transportMeta = { requireCredential: false } as const;
type Route = keyof typeof definitions;
type Flatten<T> = { [K in keyof T]: T[K] };

function normalize(value: unknown): unknown {
 if (Array.isArray(value)) return value.map(normalize);
 if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([,item]) => item !== undefined).map(([key, item]) => [key, normalize(item)]));
 return value;
}

function reviewedPublishedPath(row: (typeof baseline.routes)[number]) {
 const expected = structuredClone(row.openapi);
 const response = expected.post.responses['200'].content['application/json'];
 return { ...expected, post: { ...expected.post, responses: { ...expected.post.responses, '200': { ...expected.post.responses['200'], content: { ...expected.post.responses['200'].content, 'application/json': { ...response, schema: { ...response.schema, additionalProperties: false } } } } } } };
}

for (const route of Object.keys(definitions) as Route[]) {
 const row = baseline.routes.find(item => item.route === route)!;
 const definition = definitions[route];
 const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
 test(route + ' preserves exact public schema and response documentation', () => {
  expect(JSON.parse(JSON.stringify(projection.input))).toEqual(row.input);
  expect(frozenInputs[route]).toEqual(row.input);
  // The finite envelope closes only the outer object; frozen inputs and referenced payloads stay intact.
  expect(normalize(projection.response)).toEqual({ ...row.output, required: Object.keys(row.output.properties), additionalProperties: false });
  expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual(reviewedPublishedPath(row).post.responses['200'].content['application/json'].schema);
 });
 test(route + ' matches AJV validation, exact errors, defaults, unknown fields and response identity', async () => {
  for (const sample of baseline.samples[route]) {
   const before = structuredClone(sample), after = structuredClone(sample);
   const sentinel = { deliberatelyUnvalidatedOutput: true };
   let oldCalls = 0, newCalls = 0;
   const legacy = new Endpoint(transportMeta, frozenInputs[route], async (input: unknown) => { oldCalls++; expect(input).toBe(before); return sentinel; });
   const native = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async input => { newCalls++; expect(input).toBe(after); return sentinel; });
   const outcome = async (endpoint: { exec: (input: unknown, me: null, token: null) => Promise<unknown> }, input: unknown) => {
    try { expect(await endpoint.exec(input, null, null)).toBe(sentinel); return { valid: true }; } catch (error) {
     if (error === null || typeof error !== 'object') throw error;
     return { valid: false, ...Object.fromEntries(['code', 'id', 'info'].filter(key => key in error).map(key => [key, Reflect.get(error, key)])) };
    }
   };
   const original = await outcome(legacy, before);
   expect(await outcome(native, after)).toEqual(original);
   expect(after).toEqual(before);
   expect(newCalls).toBe(oldCalls);
   const parsed = v.safeParse(definition.input, structuredClone(sample));
   expect(parsed.success).toBe(original.valid);
   if (parsed.success) expect(parsed.output).toEqual(before);
  }
 });
 test(route + ' preserves every root and poll unknown own key safely', async () => {
  const unknown = JSON.parse('{"__proto__":{"keep":true},"constructor":{"keep":true},"prototype":{"keep":true},"toString":{"keep":true}}');
  const poll = { choices: [], ...unknown };
  const input = { ...(route === 'notes/drafts/update' ? { draftId: 'draft1' } : {}), ...unknown, poll };
  const parsed = v.parse(definition.input, input);
  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  expect(Object.getPrototypeOf(parsed.poll)).toBe(Object.prototype);
  for (const key of Object.keys(unknown)) {
   expect(Object.hasOwn(parsed, key)).toBe(true);
   expect(Reflect.get(parsed, key)).toBe(Reflect.get(input, key));
   expect(Object.hasOwn(parsed.poll!, key)).toBe(true);
   expect(Reflect.get(parsed.poll!, key)).toBe(Reflect.get(poll, key));
  }
  const before = structuredClone(input), after = structuredClone(input);
  const legacy = new Endpoint(transportMeta, frozenInputs[route], async (params: unknown) => params);
  const native = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async params => params);
  expect(await legacy.exec(before, null, null)).toBe(before);
  expect(await native.exec(after, null, null)).toBe(after);
  expect(after).toEqual(before);
 });
 test(route + ' rejects nonfinite numbers in root and poll fields', () => {
  for (const number of [NaN, Infinity, -Infinity, JSON.parse('1e309')]) {
   for (const extra of [{ scheduledAt: number }, { poll: { choices: [], expiresAt: number } }, { poll: { choices: [], expiredAfter: number } }]) {
    const body = { ...(route === 'notes/drafts/update' ? { draftId: 'draft1' } : {}), ...extra };
    expect(v.safeParse(definition.input, body).success).toBe(false);
   }
  }
 });
}

test('public 3000 note limit has pure feature ownership and backend compatibility; DB8192 stays independent', () => {
 expect(MAX_NOTE_TEXT_LENGTH).toBe(3000);
 expect(backendPublicLimit).toBe(MAX_NOTE_TEXT_LENGTH);
 expect(DB_MAX_NOTE_TEXT_LENGTH).toBe(8192);
});

test('creation applies only the four legacy defaults; updates and empty polls stay unfilled', () => {
 expect(v.parse(definitions['notes/drafts/create'].input, {})).toEqual({ visibility: 'public', localOnly: false, reactionAcceptance: null, isActuallyScheduled: false });
 expect(v.parse(definitions['notes/drafts/update'].input, { draftId: 'draft1' })).toEqual({ draftId: 'draft1' });
 expect(v.parse(definitions['notes/drafts/create'].input, { poll: { choices: [] } }).poll).toEqual({ choices: [] });
 expect(v.parse(definitions['notes/drafts/update'].input, { draftId: 'draft1', poll: { choices: [] } }).poll).toEqual({ choices: [] });
});

test('draft contracts infer canonical packed responses and preserve defaulted handler fields', () => {
 expectTypeOf<Flatten<v.InferOutput<typeof definitions['notes/drafts/create']['output']>>>().toEqualTypeOf<{ createdDraft: Packed<'NoteDraft'> }>();
 expectTypeOf<Flatten<v.InferOutput<typeof definitions['notes/drafts/update']['output']>>>().toEqualTypeOf<{ updatedDraft: Packed<'NoteDraft'> }>();
 expectTypeOf<v.InferOutput<typeof definitions['notes/drafts/create']['input']>['localOnly']>().toEqualTypeOf<boolean>();
 expectTypeOf<v.InferOutput<typeof definitions['notes/drafts/update']['input']>['localOnly']>().toEqualTypeOf<boolean | undefined>();
});

test('the real OpenAPI writer preserves both complete paths, errors, auth, metadata and 200 status', () => {
 const saved = documentedEndpoints.slice();
 try {
  documentedEndpoints.splice(0, documentedEndpoints.length, ...(Object.keys(definitions) as Route[]).map(route => {
   const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
   const meta:IEndpointMeta = { ...frozenMetas[route], res: projection.response };
   return { name: route, meta, params: projection.input };
  }));
  const config = { version: 'draft-contract-test', apiUrl: 'https://draft-contract.test/api' } as Config;
  const spec = genOpenapiSpec(config);
  expect(Object.keys(spec.paths).sort()).toEqual(baseline.routes.map(row => '/' + row.route).sort());
  for (const row of baseline.routes) expect(JSON.parse(JSON.stringify(spec.paths['/' + row.route]))).toEqual(reviewedPublishedPath(row));
  expect(genOpenapiSpec(config).paths).toEqual(spec.paths);
 } finally { documentedEndpoints.splice(0, documentedEndpoints.length, ...saved); }
});
