/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { packedReference, getPackedReference, getPackedReferenceLegacyOutputSchema } from '@features/api/contract/packed-reference.js';
import { resultObject } from '@features/api/contract/result-object.js';
import { jsonObject } from '@features/api/contract/json-object.js';
import type { Packed } from '@features/index/contract/packed.js';
import { referenceEndpointDefinitions as instanceDefinitions } from '@features/instance/contract/reference-endpoint-definitions.js';
import { referenceEndpointDefinitions as operationDefinitions } from '@features/operations/contract/reference-endpoint-definitions.js';
import { referenceEndpointDefinitions as roleDefinitions } from '@features/roles/contract/reference-endpoint-definitions.js';
import { referenceEndpointDefinitions as gameDefinitions } from '@features/games/contract/reference-endpoint-definitions.js';
import { referenceEndpointDefinitions as userDefinitions } from '@features/users/contract/reference-endpoint-definitions.js';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from './endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';
import baseline from '../../../test/fixtures/reference-contract-baseline.json' with { type: 'json' };
import type { Config } from '@/config.js';
import type { IEndpointMeta } from './endpoints.js';
import documentedEndpoints from './endpoints.js';
import { genOpenapiSpec } from './openapi/gen-spec.js';

// Run the real writer without importing endpoint handlers or Nest services.
vi.mock('./endpoints.js', () => ({ default: [] }));

const transportMeta = { requireCredential: false } as const;
const definitions = { ...instanceDefinitions, ...operationDefinitions, ...roleDefinitions, ...gameDefinitions, ...userDefinitions };

const frozenInputs = {
  "admin/meta": {
    "type": "object",
    "properties": {},
    "required": []
  },
  "admin/queue/show-job": {
    "type": "object",
    "properties": {
      "queue": {
        "type": "string",
        "enum": [
          "system",
          "endedPollNotification",
          "postScheduledNote",
          "deliver",
          "inbox",
          "db",
          "relationship",
          "objectStorage",
          "userWebhookDeliver",
          "systemWebhookDeliver"
        ]
      },
      "jobId": {
        "type": "string"
      }
    },
    "required": [
      "queue",
      "jobId"
    ]
  },
  "admin/queue/jobs": {
    "type": "object",
    "properties": {
      "queue": {
        "type": "string",
        "enum": [
          "system",
          "endedPollNotification",
          "postScheduledNote",
          "deliver",
          "inbox",
          "db",
          "relationship",
          "objectStorage",
          "userWebhookDeliver",
          "systemWebhookDeliver"
        ]
      },
      "state": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "active",
            "wait",
            "delayed",
            "completed",
            "failed"
          ]
        }
      },
      "search": {
        "type": "string"
      }
    },
    "required": [
      "queue",
      "state"
    ]
  },
  "admin/queue/queues": {
    "type": "object",
    "properties": {},
    "required": []
  },
  "admin/queue/queue-stats": {
    "type": "object",
    "properties": {
      "queue": {
        "type": "string",
        "enum": [
          "system",
          "endedPollNotification",
          "postScheduledNote",
          "deliver",
          "inbox",
          "db",
          "relationship",
          "objectStorage",
          "userWebhookDeliver",
          "systemWebhookDeliver"
        ]
      }
    },
    "required": [
      "queue"
    ]
  },
  "admin/roles/users": {
    "type": "object",
    "properties": {
      "roleId": {
        "type": "string",
        "format": "misskey:id"
      },
      "sinceId": {
        "type": "string",
        "format": "misskey:id"
      },
      "untilId": {
        "type": "string",
        "format": "misskey:id"
      },
      "sinceDate": {
        "type": "integer"
      },
      "untilDate": {
        "type": "integer"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 10
      }
    },
    "required": [
      "roleId"
    ]
  },
  "reversi/games": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 10
      },
      "sinceId": {
        "type": "string",
        "format": "misskey:id"
      },
      "untilId": {
        "type": "string",
        "format": "misskey:id"
      },
      "sinceDate": {
        "type": "integer"
      },
      "untilDate": {
        "type": "integer"
      },
      "my": {
        "type": "boolean",
        "default": false
      }
    },
    "required": []
  },
  "users/achievements": {
    "type": "object",
    "properties": {
      "userId": {
        "type": "string",
        "format": "misskey:id"
      }
    },
    "required": [
      "userId"
    ]
  }
} as const satisfies Record<keyof typeof definitions, Schema>;

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value)
			.filter(([key, child]) => child !== undefined
				&& !(key === 'required' && Array.isArray(child) && child.length === 0)
				&& !(key === 'properties' && child !== null && typeof child === 'object' && Object.keys(child).length === 0))
			.map(([key, child]) => [key, canonical(child)]));
	}
	return value;
}

function references(value: unknown, at = 'res'): { path: string; ref: unknown; hasType: boolean }[] {
	if (value === null || typeof value !== 'object') return [];
	const found = 'ref' in value ? [{ path: at, ref: value.ref, hasType: Object.hasOwn(value, 'type') }] : [];
	return [...found, ...Object.entries(value).flatMap(([key, child]) => references(child, `${at}.${key}`))];
}

test('default reference projection and canonical type stay unchanged', () => {
	const output = packedReference('QueueJob');
	expectTypeOf<v.InferOutput<typeof output>>().toEqualTypeOf<Packed<'QueueJob'>>();
	expect(getPackedReference(output)).toBe('QueueJob');
	expect(getPackedReferenceLegacyOutputSchema(output)).toEqual({ type: 'object', ref: 'QueueJob' });
	expect(projectEndpointContract(defineEndpointContract({ path: '/default-reference' }, v.looseObject({}), output)).response)
		.toEqual({ type: 'object', ref: 'QueueJob' });
});

test('omitted type is explicit, output-only, immutable, and remains canonically typed', () => {
	const options: { legacyOutputType: 'omit' | 'object' } = { legacyOutputType: 'omit' };
	const output = packedReference('QueueJob', options);
	options.legacyOutputType = 'object';
	expectTypeOf<v.InferOutput<typeof output>>().toEqualTypeOf<Packed<'QueueJob'>>();
	expect(getPackedReference(output)).toBe('QueueJob');
	expect(getPackedReferenceLegacyOutputSchema(output)).toEqual({ ref: 'QueueJob' });
	expect(Object.isFrozen(getPackedReferenceLegacyOutputSchema(output))).toBe(true);
	const projected = projectEndpointContract(defineEndpointContract({ path: '/omitted-reference' }, v.looseObject({}), output));
	expect(projected.response).toEqual({ ref: 'QueueJob' });
	expect(projected.response).not.toHaveProperty('type');
	expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual({ $ref: '#/components/schemas/QueueJob' });
	expect(v.is(output, {})).toBe(false);
	expect(() => toLegacyJsonSchema(output, { target: 'openapi-3.0', typeMode: 'output' })).toThrow();
});

test('metadata, nullable and optional wrappers retain omitted reference projection', () => {
	const output = resultObject({
		value: v.exactOptional(v.pipe(v.nullable(packedReference('QueueMetrics', { legacyOutputType: 'omit' })),
			v.metadata({ description: 'Optional metrics.' }))),
	});
	const projected = projectEndpointContract(defineEndpointContract({ path: '/wrapped-reference' }, v.looseObject({}), output));
	expect(projected.response?.properties?.value).toEqual({ ref: 'QueueMetrics', nullable: true, description: 'Optional metrics.', optional: true });
	expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual({
		type: 'object', properties: { value: { description: 'Optional metrics.', oneOf: [{ $ref: '#/components/schemas/QueueMetrics' }, { type: 'null' }] } },
	});
});

test('invalid output projection modes fail instead of silently changing reference semantics', () => {
	expect(() => {
		// @ts-expect-error Exercise a JavaScript caller passing an unsupported mode.
		return packedReference('QueueJob', { legacyOutputType: 'invalid' });
	}).toThrow('Unsupported packed reference legacy output type: invalid');
});

const packedInputs = [
	jsonObject({ value: packedReference('QueueJob', { legacyOutputType: 'omit' }) }),
	packedReference('QueueJob', { legacyOutputType: 'omit' }),
	v.looseObject({ value: packedReference('QueueJob', { legacyOutputType: 'omit' }) }),
	v.looseObject({ value: v.exactOptional(v.nullable(packedReference('QueueJob', { legacyOutputType: 'omit' }))) }),
	v.looseObject({ values: v.array(packedReference('QueueJob', { legacyOutputType: 'omit' })) }),
	v.looseObject({ value: v.pipe(packedReference('QueueJob', { legacyOutputType: 'omit' }), v.metadata({ description: 'Input must reject this.' })) }),
];

test.each(packedInputs)('omitted type references are rejected as endpoint inputs', input => {
	expect(() => projectEndpointContract(defineEndpointContract({ path: '/reject-packed-input' }, input, v.void())))
		.toThrow('Legacy input contracts cannot use packed references');
});

describe('clean eight route projections', () => {
	for (const [route, definition] of Object.entries(definitions)) {
		test(route, () => {
			const original = baseline.routes.find(row => row.route === route)!;
			const projected = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			expect(canonical(projected.input)).toEqual(canonical(original.input));
			expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true))
				.toEqual(original.openapi.post.responses['200'].content['application/json'].schema);
			expect(references(projected.response)).toEqual(references(original.output));
		});
	}
});

test('role assignment expiresAt remains required and nullable in public documentation', () => {
	const projected = projectEndpointContract(roleDefinitions['admin/roles/users']);
	const openapi = convertSchemaToOpenApiSchema(projected.response!, 'res', true);
	expect(openapi.items.required).toEqual(['id', 'createdAt', 'user', 'expiresAt']);
	expect(openapi.items.properties.expiresAt.type).toEqual(['string', 'null']);
});

test('responses return the original packed payload and all extension fields', async () => {
	const value: Packed<'QueueJob'> & { retainedExtension: boolean } = {
		id: 'job1', name: 'example', data: {}, opts: {}, timestamp: 1, progress: 0,
		attempts: 0, delay: 0, failedReason: '', stacktrace: [], returnValue: undefined, isFailed: false,
		retainedExtension: true,
	};
	const projection = projectEndpointContract(operationDefinitions['admin/queue/show-job']);
	const endpoint = new ContractEndpoint({}, projection, async () => value);
	expect(await endpoint.exec({ queue: 'deliver', jobId: 'job1' }, null, null)).toBe(value);
	expect(value.retainedExtension).toBe(true);
});

test('new bridge retains actual legacy AJV defaults, unknown fields and errors', async () => {
	const original = baseline.routes.find(row => row.route === 'reversi/games')!;
	const projection = projectEndpointContract(gameDefinitions['reversi/games']);
	const old = new Endpoint({}, frozenInputs['reversi/games'], async (_params: unknown) => []);
	const current = new ContractEndpoint({}, projection, async () => []);
	for (const sample of [{}, { my: true, future: 'keep' }, { limit: 0 }, { limit: null }, { sinceId: 'bad-id' }, [], null]) {
		const before = structuredClone(sample);
		const after = structuredClone(sample);
		expect(await Promise.allSettled([current.exec(after, null, null)]))
			.toEqual(await Promise.allSettled([old.exec(before, null, null)]));
		expect(after).toEqual(before);
	}
});

test('the actual writer preserves all eight complete published OpenAPI paths', () => {
	const saved = documentedEndpoints.slice();
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...Object.entries(definitions).map(([route, definition]) => {
			const original = baseline.routes.find(row => row.route === route)!;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			const { res: _res, ...metadata } = original.meta;
			return { name: route, meta: { ...metadata, res: projection.response } as IEndpointMeta, params: projection.input };
		}));
		const config = { version: 'reference-contract-test', apiUrl: 'https://reference.test/api' } as Config;
		const spec = genOpenapiSpec(config);
		expect(Object.keys(spec.paths).sort()).toEqual(baseline.routes.map(row => '/' + row.route).sort());
		for (const original of baseline.routes) {
			expect(JSON.parse(JSON.stringify(spec.paths['/' + original.route]))).toEqual(original.openapi);
		}
		expect(genOpenapiSpec(config).paths).toEqual(spec.paths);
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});

test('every migrated request preserves native/AJV object, array and unknown-own-key semantics', async () => {
	const validInputs = {
		'admin/meta': {},
		'admin/queue/show-job': { queue: 'deliver', jobId: 'job1' },
		'admin/queue/jobs': { queue: 'deliver', state: ['wait', 'wait'] },
		'admin/queue/queues': {},
		'admin/queue/queue-stats': { queue: 'deliver' },
		'admin/roles/users': { roleId: 'role1' },
		'reversi/games': {},
		'users/achievements': { userId: 'user1' },
	} as const;
	const ownKeys = JSON.parse('{"__proto__":{"retained":true},"constructor":{"retained":true},"prototype":true,"__defineGetter__":"retained","toString":"retained","hasOwnProperty":"retained","future":{"retained":true}}');
	for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
		const definition = definitions[route];
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
		const payload = { unchanged: true };
		const old = new Endpoint({}, frozenInputs[route], async (_params: unknown) => payload);
		const current = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async () => payload);
		const samples = [validInputs[route], { ...validInputs[route], ...ownKeys }, [], [1], null, 'string', 1, true];
		for (const sample of samples) {
			const before = structuredClone(sample);
			const after = structuredClone(sample);
			const [legacy] = await Promise.allSettled([old.exec(before, null, null)]);
			const [nativeBridge] = await Promise.allSettled([current.exec(after, null, null)]);
			expect(nativeBridge).toEqual(legacy);
			expect(after).toEqual(before);
			const parsed = v.safeParse(definition.input, structuredClone(sample));
			expect(parsed.success).toBe(legacy.status === 'fulfilled');
			if (parsed.success) {
				expect(parsed.output).toEqual(before);
				expect(Object.getPrototypeOf(parsed.output)).toBe(Object.prototype);
				for (const key of Object.keys(ownKeys)) {
					if (sample !== null && typeof sample === 'object' && Object.hasOwn(sample, key)) {
						expect(Object.hasOwn(parsed.output, key)).toBe(true);
					}
				}
			}
		}
	}
});
