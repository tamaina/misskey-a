/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import type { Config } from '@/config.js';
import type { Packed } from '@features/index/contract/packed.js';
import { notesCreateDefinition } from '@features/notes/contract/create-endpoint-definition.js';
import { MAX_NOTE_TEXT_LENGTH } from '@features/notes/contract/note-text-limit.js';
import { jsonString } from '@features/api/contract/index.js';
import { jsonObject } from '@features/api/contract/json-object.js';
import { requireWhenAllNullish } from '@features/api/contract/require-when-all-nullish.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { endpoints as documentedEndpoints } from '@features/index/backend/endpoints.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
import baseline from '../../../test/fixtures/note-create-contract-baseline.json' with { type: 'json' };

const frozenInput = {
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
    "noExtractMentions": {
      "type": "boolean",
      "default": false
    },
    "noExtractHashtags": {
      "type": "boolean",
      "default": false
    },
    "noExtractEmojis": {
      "type": "boolean",
      "default": false
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
      "minLength": 1,
      "maxLength": 3000,
      "nullable": true
    },
    "fileIds": {
      "type": "array",
      "uniqueItems": true,
      "minItems": 1,
      "maxItems": 16,
      "items": {
        "type": "string",
        "format": "misskey:id"
      }
    },
    "mediaIds": {
      "type": "array",
      "uniqueItems": true,
      "minItems": 1,
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
          "minItems": 2,
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
    }
  },
  "if": {
    "properties": {
      "renoteId": {
        "type": "null"
      },
      "fileIds": {
        "type": "null"
      },
      "mediaIds": {
        "type": "null"
      },
      "poll": {
        "type": "null"
      }
    }
  },
  "then": {
    "properties": {
      "text": {
        "type": "string",
        "minLength": 1,
        "maxLength": 3000,
        "pattern": "[^\\s]+"
      }
    },
    "required": [
      "text"
    ]
  }
} as const;
const frozenMeta = {
  "tags": [
    "notes"
  ],
  "requireCredential": true,
  "prohibitMoved": true,
  "limit": {
    "duration": 3600000,
    "max": 300
  },
  "kind": "write:notes",
  "res": {
    "type": "object",
    "optional": false,
    "nullable": false,
    "properties": {
      "createdNote": {
        "type": "object",
        "optional": false,
        "nullable": false,
        "ref": "Note"
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
    }
  }
} as const;
vi.mock('@features/index/backend/endpoints.js', () => ({ endpoints: [] }));
const transportMeta = { requireCredential: false } as const;
const projection = projectEndpointContract(notesCreateDefinition);
type Flatten<T> = { [K in keyof T]: T[K] };

function normalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalize);
	if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, normalize(item)]));
	return value;
}

test('notes/create preserves exact frozen input, condition, response and public3000 limit', () => {
	expect(JSON.parse(JSON.stringify(projection.input))).toEqual(baseline.routes[0].input);
	expect(frozenInput).toEqual(baseline.routes[0].input);
	expect(normalize(projection.response)).toEqual({ ...baseline.routes[0].output, required: ['createdNote'] });
	expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual(baseline.routes[0].openapi.post.responses['200'].content['application/json'].schema);
	expect(MAX_NOTE_TEXT_LENGTH).toBe(3000);
});

test('notes/create matches 557 frozen native/AJV cases, exact errors, defaults and output identity', async () => {
	for (const sample of baseline.samples) {
		const before = structuredClone(sample), after = structuredClone(sample);
		const sentinel = { deliberatelyUnvalidatedOutput: true };
		let oldCalls = 0, newCalls = 0;
		const legacy = new Endpoint(transportMeta, frozenInput, async (input: unknown) => { oldCalls++; expect(input).toBe(before); return sentinel; });
		const native = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async input => { newCalls++; expect(input).toBe(after); return sentinel; });
		const outcome = async (endpoint: { exec: (input: unknown, me: null, token: null) => Promise<unknown> }, input: unknown) => {
			try { expect(await endpoint.exec(input, null, null)).toBe(sentinel); return { valid: true }; } catch (error) {
				if (error === null || typeof error !== 'object') throw error;
				return { valid: false, ...Object.fromEntries(['code', 'id', 'info'].filter(key => key in error).map(key => [key, Reflect.get(error, key)])) };
			}
		};
		const oldOutcome = await outcome(legacy, before);
		expect(await outcome(native, after), JSON.stringify(sample)).toEqual(oldOutcome);
		expect(after).toEqual(before);
		expect(newCalls).toBe(oldCalls);
		const parsed = v.safeParse(notesCreateDefinition.input, structuredClone(sample));
		expect(parsed.success, JSON.stringify(sample)).toBe(oldOutcome.valid);
		if (parsed.success) expect(parsed.output).toEqual(before);
	}
});

test('text conditional preserves whitespace bypass while ordinary validation remains active', () => {
	for (const content of [{ renoteId: 'renote1' }, { fileIds: ['file1'] }, { mediaIds: ['file2'] }, { poll: { choices: ['a', 'b'] } }]) {
		expect(v.safeParse(notesCreateDefinition.input, content).success).toBe(true);
		expect(v.safeParse(notesCreateDefinition.input, { ...content, text: null }).success).toBe(true);
		expect(v.safeParse(notesCreateDefinition.input, { ...content, text: ' ' }).success).toBe(true);
		expect(v.safeParse(notesCreateDefinition.input, { ...content, text: '' }).success).toBe(false);
		expect(v.safeParse(notesCreateDefinition.input, { ...content, text: 'x'.repeat(3001) }).success).toBe(false);
	}
	for (const body of [{}, { text: null }, { text: ' ' }, { replyId: 'reply1' }, { channelId: 'channel1' }, { renoteId: null, poll: null }]) expect(v.safeParse(notesCreateDefinition.input, body).success).toBe(false);
	for (const files of [{ fileIds: [] }, { mediaIds: [] }, { fileIds: null }, { mediaIds: null }]) expect(v.safeParse(notesCreateDefinition.input, { ...files, text: 'x', renoteId: 'renote1' }).success).toBe(false);
});

test('only the six old root defaults are filled; dependency and poll defaults remain absent', () => {
	const parsed = v.parse(notesCreateDefinition.input, { text: 'x' });
	expect(parsed).toEqual({ text: 'x', visibility: 'public', localOnly: false, reactionAcceptance: null, noExtractMentions: false, noExtractHashtags: false, noExtractEmojis: false });
	const poll = v.parse(notesCreateDefinition.input, { poll: { choices: ['a', 'b'] } }).poll;
	expect(poll).toEqual({ choices: ['a', 'b'] });
});

test('root and poll unknown own keys remain safe and are never rewritten by transport', async () => {
	const unknown = JSON.parse('{"__proto__":{"keep":true},"constructor":{"keep":true},"prototype":{"keep":true},"toString":{"keep":true}}');
	const poll = { choices: ['a', 'b'], ...unknown };
	const input = { ...unknown, poll };
	const parsed = v.parse(notesCreateDefinition.input, input);
	expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
	expect(Object.getPrototypeOf(parsed.poll)).toBe(Object.prototype);
	for (const key of Object.keys(unknown)) {
		expect(Object.hasOwn(parsed, key)).toBe(true);
		expect(Reflect.get(parsed, key)).toBe(Reflect.get(input, key));
		expect(Object.hasOwn(parsed.poll!, key)).toBe(true);
		expect(Reflect.get(parsed.poll!, key)).toBe(Reflect.get(poll, key));
	}
	const before = structuredClone(input), after = structuredClone(input);
	const legacy = new Endpoint(transportMeta, frozenInput, async (params: unknown) => params);
	const native = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async params => params);
	expect(await legacy.exec(before, null, null)).toBe(before);
	expect(await native.exec(after, null, null)).toBe(after);
	expect(after).toEqual(before);
});

test('nonfinite poll expiry values remain invalid and never coerce', () => {
	for (const number of [NaN, Infinity, -Infinity, JSON.parse('1e309')]) for (const key of ['expiresAt', 'expiredAfter']) expect(v.safeParse(notesCreateDefinition.input, { poll: { choices: ['a', 'b'], [key]: number } }).success).toBe(false);
});

test('contract inference keeps canonical Note and exact defaulted handler fields', () => {
	expectTypeOf<Flatten<v.InferOutput<typeof notesCreateDefinition.output>>>().toEqualTypeOf<{ createdNote: Packed<'Note'> }>();
	expectTypeOf<v.InferOutput<typeof notesCreateDefinition.input>['visibility']>().toEqualTypeOf<'public' | 'home' | 'followers' | 'specified'>();
	expectTypeOf<v.InferOutput<typeof notesCreateDefinition.input>['localOnly']>().toEqualTypeOf<boolean>();
	expectTypeOf<v.InferOutput<typeof notesCreateDefinition.input>['noExtractMentions']>().toEqualTypeOf<boolean>();
	expectTypeOf<v.InferOutput<typeof notesCreateDefinition.input>['text']>().toEqualTypeOf<string | null | undefined>();
});

test('real OpenAPI writer preserves complete notes/create path, auth, errors and 200 status', () => {
	const saved = documentedEndpoints.slice();
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, { name: 'notes/create', meta: { ...frozenMeta, res: projection.response }, params: projection.input });
		const config = { version: 'note-create-contract-test', apiUrl: 'https://note-create-contract.test/api' } as Config;
		const spec = genOpenapiSpec(config);
		expect(Object.keys(spec.paths)).toEqual(['/notes/create']);
		expect(JSON.parse(JSON.stringify(spec.paths['/notes/create']))).toEqual(baseline.routes[0].openapi);
		expect(genOpenapiSpec(config).paths).toEqual(spec.paths);
	} finally { documentedEndpoints.splice(0, documentedEndpoints.length, ...saved); }
});

function conditionalBase() { return jsonObject({ dependency: v.exactOptional(v.nullable(v.string())), text: v.exactOptional(v.nullable(jsonString({ minLength: 1 }))) }); }

function project(input: v.GenericSchema) { return projectEndpointContract(defineEndpointContract({ path: '/conditional-proof' }, input, v.void())).input; }

test('conditional validation accepts only its exact original JSON-object placement', () => {
	const base = conditionalBase(), action = requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema: jsonString({ minLength: 1, pattern: '[^\\s]+' }) });
	expect(Object.isFrozen(action)).toBe(true);
	expect(project(v.pipe(base, action))).toEqual({ type: 'object', properties: { dependency: { type: 'string', nullable: true }, text: { type: 'string', minLength: 1, nullable: true } }, if: { properties: { dependency: { type: 'null' } } }, then: { properties: { text: { type: 'string', minLength: 1, pattern: '[^\\s]+' } }, required: ['text'] } });
	for (const invalid of [v.pipe(conditionalBase(), action), v.pipe(base, action, action), v.pipe(v.looseObject(base.entries), action), v.pipe(base, v.metadata({ description: 'separate action' }), action)]) {
		expect(() => project(invalid)).toThrow(/original JSON-object|exact guard and parser|immediately follow/);
		expect(() => toLegacyJsonSchema(invalid)).toThrow(/original JSON-object|exact guard and parser|immediately follow/);
	}
	expect(() => project(v.pipe(base, v.check(() => true)))).toThrow(/unregistered validation/);
});

test('conditional schema and dependency config are captured without a raw metadata source of truth', () => {
	const base = conditionalBase(), dependencies: 'dependency'[] = ['dependency'];
	const options = { minLength: 1, pattern: '[^\\s]+' };
	const schema = jsonString(options), config = { dependencies, key: 'text' as 'text' | 'dependency', schema };
	const action = requireWhenAllNullish(base, config), input = v.pipe(base, action);
	options.minLength = 100;
	options.pattern = 'impossible';
	dependencies.splice(0, 1);
	config.key = 'dependency';
	config.schema = jsonString({ minLength: 100 });
	expect(v.safeParse(input, { dependency: 'content' }).success).toBe(true);
	expect(Reflect.set(action, 'requirement', () => true)).toBe(false);
	expect(Reflect.set(schema, 'type', 'string')).toBe(false);
	expect(Reflect.set(base.entries.dependency, 'default', 'content')).toBe(false);
	expect(v.safeParse(input, { text: 'x' }).success).toBe(true);
	expect(v.safeParse(input, { text: ' ' }).success).toBe(false);
	expect(Object.isFrozen(schema)).toBe(true);
	for (const metadata of [{ if: { properties: {} } }, { then: { required: [] } }, { properties: {} }, { type: 'array' }]) expect(() => project(v.pipe(input, v.metadata(metadata)))).toThrow(/annotation-only metadata|proven no-op object metadata/);
});

test('outer defaults on dependencies or the target are refused before native/AJV ordering can differ', () => {
	const schema = jsonString({ minLength: 1 });
	for (const dependency of [v.optional(v.string(), 'content'), v.nullable(v.string(), 'content'), v.optional(v.string(), () => 'content'), v.pipe(v.exactOptional(v.string()), v.metadata({ default: 'content' })), v.union([v.optional(v.string(), 'content'), v.undefined()]), v.exactOptional(v.union([v.nullable(v.string(), 'content'), v.number()])), v.intersect([v.optional(v.string(), 'content'), v.undefined()])]) {
		const base = jsonObject({ dependency, text: v.exactOptional(v.nullable(schema)) });
		expect(() => requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema })).toThrow(/outer defaults/);
	}
	const base = jsonObject({ dependency: v.exactOptional(v.string()), text: v.optional(schema, 'text') });
	expect(() => requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema })).toThrow(/outer defaults/);
});

test('outer union options cannot mutate after conditional registration', () => {
	const dependency = v.exactOptional(v.union([v.null(), v.string()]));
	const base = jsonObject({ dependency, text: v.exactOptional(v.nullable(jsonString({ minLength: 1 }))) });
	const action = requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema: jsonString({ minLength: 1 }) });
	expect(Object.isFrozen(dependency.wrapped.options)).toBe(true);
	expect(() => dependency.wrapped.options.push(v.null())).toThrow();
	expect(v.safeParse(v.pipe(base, action), { dependency: 'content' }).success).toBe(true);
});

test('lazy converter returns reject wrong-base conditional reuse and preserve valid registrations', () => {
	const base = conditionalBase(), action = requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema: jsonString({ minLength: 1 }) });
	expect(() => toLegacyJsonSchema(v.lazy(() => v.pipe(conditionalBase(), action)))).toThrow(/original JSON-object/);
	const lazy = toLegacyJsonSchema(v.lazy(() => v.pipe(base, action)));
	expect(lazy.$ref).toBeDefined();
	expect(Object.values(lazy.$defs ?? {})).toContainEqual(toLegacyJsonSchema(v.pipe(base, action)));
});

test('conditional target cannot be supplied through raw string schemas or predicate registration', () => {
	const base = conditionalBase();
	for (const schema of [v.string(), v.custom<string>(() => true), v.pipe(v.string(), v.metadata({ minLength: 1, pattern: '[^\\s]+' }))]) expect(() => requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema })).toThrow(/registered canonical JSON string/);
	for (const dependencies of [[], ['dependency', 'dependency'], ['text']] as const) expect(() => requireWhenAllNullish(base, { dependencies, key: 'text', schema: jsonString({ minLength: 1 }) })).toThrow(/distinct declared/);
});

test('default-order guard rejects a real null-to-content union default before conditional construction', () => {
	const dependency = v.exactOptional(v.union([v.nullable(v.string(), 'content'), v.number()]));
	const base = jsonObject({ dependency, text: v.exactOptional(v.nullable(jsonString({ minLength: 1 }))) });
	expect(v.parse(base, { dependency: null })).toEqual({ dependency: 'content' });
	expect(() => requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema: jsonString({ minLength: 1 }) })).toThrow(/outer defaults/);
});

test('conditional projection retains every nonempty ordinary required list', () => {
	const base = jsonObject({ dependency: v.exactOptional(v.string()), text: v.exactOptional(v.nullable(jsonString({ minLength: 1 }))), other: v.string() });
	const action = requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema: jsonString({ minLength: 1 }) });
	expect(project(v.pipe(base, action)).required).toEqual(['other']);
	const then = toLegacyJsonSchema(v.pipe(base, action)).then;
	if (then === undefined || typeof then === 'boolean') throw new Error('Expected an object conditional projection');
	expect(then.required).toEqual(['text']);
});

test('canonical JSON-string targets are frozen before callers can weaken public validation', () => {
	const schema = jsonString({ minLength: 1, pattern: '[^\\s]+' });
	expect(Object.isFrozen(schema)).toBe(true);
	expect(Reflect.set(schema, 'check', () => true)).toBe(false);
	const base = conditionalBase(), action = requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema });
	expect(v.safeParse(v.pipe(base, action), { text: ' ' }).success).toBe(false);
	const then = toLegacyJsonSchema(v.pipe(base, action)).then;
	if (then === undefined || typeof then === 'boolean') throw new Error('Expected an object conditional projection');
	expect(then.properties?.text).toEqual({ type: 'string', minLength: 1, pattern: '[^\\s]+' });
});

test('conditional bases require the exact factory return while configured valid inputs retain the rule', () => {
	const base = conditionalBase(), schema = jsonString({ minLength: 1 });
	for (const copy of [Object.freeze({ ...base }), Object.freeze(v.config(base, { abortEarly: true }))]) expect(() => requireWhenAllNullish(copy, { dependencies: ['dependency'], key: 'text', schema })).toThrow(/original JSON-object base/);
	const action = requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema });
	expect(toLegacyJsonSchema(v.config(v.pipe(base, action), { abortEarly: true }))).toEqual(toLegacyJsonSchema(v.pipe(base, action)));
});

test('conditional outer lazy fields are refused without executing caller getters', () => {
	let calls = 0;
	const dependency = v.exactOptional(v.lazy(() => { calls++; return v.nullable(v.string(), 'content'); }));
	const base = jsonObject({ dependency, text: v.exactOptional(v.nullable(jsonString({ minLength: 1 }))) });
	expect(() => requireWhenAllNullish(base, { dependencies: ['dependency'], key: 'text', schema: jsonString({ minLength: 1 }) })).toThrow(/lazy schemas/);
	expect(calls).toBe(0);
});
