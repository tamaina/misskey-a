/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { addGlobalDefs, getGlobalDefs } from '@valibot/to-json-schema';
import { packedReference } from '../../../../features/api/contract/packed-reference.js';
import { resultObject } from '../../../../features/api/contract/result-object.js';
import { legacyOutputTuple, getLegacyOutputTupleItems } from '../../../../features/api/contract/legacy-output-tuple.js';
import { jsonNumber } from '../../../../features/api/contract/json-number.js';
import { jsonObject } from '../../../../features/api/contract/json-object.js';
import { defineEndpointContract } from '../../../../features/api/contract/definition.js';
import { toLegacyJsonSchema } from '../../../../features/api/backend/index.js';
import { EndpointImplementation as DeliverDelayedEndpoint, meta as deliverMeta } from '../../../../features/operations/backend/endpoints/admin/queue/deliver-delayed.js';
import { EndpointImplementation as InboxDelayedEndpoint, meta as inboxMeta } from '../../../../features/operations/backend/endpoints/admin/queue/inbox-delayed.js';
import { delayedTupleEndpointDefinitions as definitions, delayedTupleAdminQueueDeliverDelayedOutput, delayedTupleAdminQueueInboxDelayedOutput } from '../../../../features/operations/contract/delayed-tuple-endpoint-definitions.js';
import type { DelayedTupleEndpoints } from '../../../../features/operations/contract/delayed-tuple-endpoint-definitions.js';
import { Endpoint } from './endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';
import { genOpenapiSpec } from './openapi/gen-spec.js';
import type { Config } from '@/config.js';
import type { Schema } from '@/misc/json-schema.js';
import type { IEndpointMeta } from './endpoints.js';
import documentedEndpoints from './endpoints.js';
import baseline from '../../../test/fixtures/delayed-tuple-contract-baseline.json' with { type: 'json' };

vi.mock('./endpoints.js', () => ({ default: [] }));
const transportMeta = { requireCredential: false } as const;
const frozenInput = { type: 'object', properties: {}, required: [] } as const;

function project(output: v.GenericSchema) {
	return projectEndpointContract(defineEndpointContract({ path: '/tuple-proof' }, jsonObject({}), output));
}

interface FrozenRow {
	route: keyof typeof definitions;
	input: Schema;
	output: Schema;
	meta: IEndpointMeta;
	openapi: unknown;
}
// This assertion bridges only the frozen legacy schema dialect, never request or response payloads.
const rows = baseline.routes as unknown as readonly FrozenRow[];

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value)
			.filter(([key, member]) => member !== undefined
				&& !(key === 'required' && Array.isArray(member) && member.length === 0)
				&& !(key === 'properties' && member !== null && typeof member === 'object' && Object.keys(member).length === 0)
				&& !(key === 'additionalProperties' && member === true))
			.map(([key, member]) => [key, canonical(member)]));
	}
	return value;
}

test('registration owns a public strictTuple with ordered inferred type', () => {
	const items = [v.string(), jsonNumber] as const;
	const output = legacyOutputTuple(items);
	expect(output.items).not.toBe(items);
	expect(output.type).toBe('strict_tuple');
	expect(output.reference).toBe(v.strictTuple);
	expect(getLegacyOutputTupleItems(output)).toEqual(items);
	expect(getLegacyOutputTupleItems(v.strictTuple([v.string(), jsonNumber]))).toBeUndefined();
	expectTypeOf<v.InferInput<typeof output>>().toEqualTypeOf<[string, number]>();
	expectTypeOf<v.InferOutput<typeof output>>().toEqualTypeOf<[string, number]>();
});

test('later item-array mutation cannot desynchronize the native parser and output projection', () => {
	const items: [v.StringSchema<undefined>, typeof jsonNumber] = [v.string(), jsonNumber];
	const output = legacyOutputTuple(items);
	expect(Object.isFrozen(output)).toBe(true);
	expect(Object.isFrozen(output.items)).toBe(true);
	items.reverse();
	items.push(v.string());
	expect(getLegacyOutputTupleItems(output)).toHaveLength(2);
	expect(Reflect.set(output, 'items', [jsonNumber, v.string()])).toBe(false);
	expect(v.safeParse(output, ['example.com', 12]).success).toBe(true);
	expect(v.safeParse(output, [12, 'example.com']).success).toBe(false);
	expect(project(output).response).toEqual({ type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], unevaluatedItems: false });
});

test('registration rejects externally constructed tuple schemas and unsupported item schemas', () => {
	for (const schema of [v.strictTuple([v.string(), jsonNumber]), v.tuple([v.string(), jsonNumber]), v.config(v.strictTuple([v.string(), jsonNumber]), {}), v.message(v.strictTuple([v.string(), jsonNumber]), 'Wrapped')]) {
		expect(() => {
			// @ts-expect-error The helper owns tuple construction and does not accept external tuple schemas.
			return legacyOutputTuple(schema);
		}).toThrow('Legacy output tuples support only bare v.string() and the exact jsonNumber schema');
	}
	const unsupported = [v.number(), v.nullable(v.string()), v.looseObject({}), v.lazy(() => v.string()), v.pipe(v.string(), v.metadata({ description: 'Piped' })), v.fallback(v.string(), ''), v.string('Message'), packedReference('Note')];
	for (const item of unsupported) {
		expect(() => {
			// @ts-expect-error Unsupported scalar wrappers and non-scalar items need a separate design.
			return legacyOutputTuple([item, jsonNumber]);
		}).toThrow('Legacy output tuples support only bare v.string() and the exact jsonNumber schema');
	}
});

test('the oRPC endpoint map owns both ordered tuple responses', () => {
	expectTypeOf<v.InferOutput<typeof delayedTupleAdminQueueDeliverDelayedOutput>>().toEqualTypeOf<[string, number][]>();
	expectTypeOf<v.InferOutput<typeof delayedTupleAdminQueueInboxDelayedOutput>>().toEqualTypeOf<[string, number][]>();
	expectTypeOf<DelayedTupleEndpoints['admin/queue/deliver-delayed']['res']>().toEqualTypeOf<[string, number][]>();
	expectTypeOf<DelayedTupleEndpoints['admin/queue/inbox-delayed']['res']>().toEqualTypeOf<[string, number][]>();
});

test('native strict tuple validation rejects short, reordered and extra values without truncation', () => {
	const output = legacyOutputTuple([v.string(), jsonNumber]);
	expect(v.safeParse(output, ['example.com', 12]).success).toBe(true);
	for (const value of [[], ['example.com'], [12, 'example.com'], ['example.com', 12, 'extra'], [null, 12], ['example.com', null], ['example.com', Infinity]]) {
		const unchanged = structuredClone(value);
		expect(v.safeParse(output, value).success).toBe(false);
		expect(value).toEqual(unchanged);
	}
	const extra = ['example.com', 12, 'extra'];
	expect(v.parse(v.tuple([v.string(), jsonNumber]), extra)).toEqual(['example.com', 12]);
	expect(extra).toEqual(['example.com', 12, 'extra']);
});

test('registered output preserves the exact old tuple document and its missing minItems', () => {
	const output = legacyOutputTuple([v.string(), jsonNumber]);
	expect(project(output).response).toEqual({ type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], unevaluatedItems: false });
	expect(project(output).response).not.toHaveProperty('minItems');
	expect(project(output).response).not.toHaveProperty('maxItems');
	expect(project(output).response).not.toHaveProperty('items');
});

test('unregistered tuple conversion remains unchanged outside the narrow output registration', () => {
	const native = v.strictTuple([v.string(), jsonNumber]);
	const registered = legacyOutputTuple([v.string(), jsonNumber]);
	const expected = { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'number' }] }, minItems: 2, maxItems: 2 };
	expect(toLegacyJsonSchema(native, { target: 'openapi-3.0', typeMode: 'output' })).toEqual(expected);
	expect(toLegacyJsonSchema(registered, { target: 'openapi-3.0', typeMode: 'output' })).toEqual(expected);
	expect(project(native).response).toEqual(expected);
});

test('documentation metadata wrappers retain the registered output prefix', () => {
	const output = v.pipe(v.nullable(legacyOutputTuple([v.string(), jsonNumber])), v.metadata({ description: 'Delayed counts.' }));
	expect(project(output).response).toEqual({ type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], unevaluatedItems: false, nullable: true, description: 'Delayed counts.' });
});

test('raw and overwritten prefixItems metadata cannot gain an output exception', () => {
	const forged = [{ type: 'string' }, { type: 'number' }];
	const raw = v.pipe(v.array(v.unknown()), v.metadata({ prefixItems: forged, unevaluatedItems: false }));
	const overwritten = v.pipe(legacyOutputTuple([v.string(), jsonNumber]), v.metadata({ prefixItems: forged }));
	const previousProjection = project(legacyOutputTuple([v.string(), jsonNumber])).response!;
	const recycled = v.pipe(v.array(v.unknown()), v.metadata({ prefixItems: previousProjection.prefixItems, unevaluatedItems: false }));
	const loosened = v.pipe(legacyOutputTuple([v.string(), jsonNumber]), v.metadata({ unevaluatedItems: true }));
	const replacedItems = v.pipe(legacyOutputTuple([v.string(), jsonNumber]), v.metadata({ items: {} }));
	for (const output of [raw, recycled, v.array(raw)]) {
		expect(() => project(output)).toThrow('Referenced or tuple response schemas require an explicit legacy projection');
	}
	for (const output of [overwritten, loosened, replacedItems]) expect(() => project(output)).toThrow('Legacy output tuple pipelines require annotation-only metadata');
});

test('registered tuple inputs stay rejected at every supported nesting point', () => {
	const tuple = legacyOutputTuple([v.string(), jsonNumber]);
	const inputs = [tuple, jsonObject({ pair: tuple }), jsonObject({ pairs: v.array(tuple) }), jsonObject({ pair: v.exactOptional(v.nullable(tuple)) }), jsonObject({ pair: v.pipe(tuple, v.metadata({ description: 'Input forbidden.' })) })];
	for (const input of inputs) {
		expect(() => projectEndpointContract(defineEndpointContract({ path: '/input-tuple-forbidden' }, input, v.void())))
			.toThrow('Legacy input contracts cannot use output-only tuple projections');
	}
});

describe('two exact delayed-route projections', () => {
	for (const row of rows) {
		test(row.route, () => {
			const projected = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[row.route]);
			expect(canonical(projected.input)).toEqual(canonical(row.input));
			expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual(convertSchemaToOpenApiSchema(row.output, 'res', true));
		});
	}
});

test('the actual writer preserves complete document, all methods/auth/errors and published paths', () => {
	const saved = documentedEndpoints.slice();
	try {
		const config = { version: 'delayed-tuple-test', apiUrl: 'https://tuple.test/api' } as Config;
		documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(row => ({ name: row.route, meta: row.meta, params: row.input })));
		const oldDocument = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(row => {
			const projected = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[row.route]);
			return { name: row.route, meta: { ...row.meta, res: projected.response }, params: projected.input };
		}));
		const newDocument = genOpenapiSpec(config);
		expect(JSON.parse(JSON.stringify(newDocument))).toEqual(JSON.parse(JSON.stringify(oldDocument)));
		for (const row of rows) expect(JSON.parse(JSON.stringify(newDocument.paths['/' + row.route]))).toEqual(row.openapi);
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});

test('the bridge returns original response and tuple identities, even when native parsing would fail', async () => {
	const pair: [string, number] = ['example.com', 12];
	pair.push('retain-third');
	Object.assign(pair, { retainedExtension: true });
	const payload = [pair];
	Object.assign(payload, { retainedExtension: true });
	const definition = definitions['admin/queue/deliver-delayed'];
	expect(v.safeParse(definition.output, payload).success).toBe(false);
	const current = new ContractEndpoint(transportMeta, projectEndpointContract(definition), async () => payload);
	const result = await current.exec({}, null, null);
	expect(result).toBe(payload);
	expect(result[0]).toBe(pair);
	expect(result[0]).toEqual(Object.assign(['example.com', 12, 'retain-third'], { retainedExtension: true }));
	expect(Object.hasOwn(result, 'retainedExtension')).toBe(true);
});

test('both requests retain native and legacy AJV object/unknown-own-key acceptance', async () => {
	const ownKeys = JSON.parse('{"__proto__":{"retained":true},"constructor":{"retained":true},"prototype":true,"future":{"retained":true}}');
	for (const definition of Object.values(definitions)) {
		const projection = projectEndpointContract(definition);
		const legacy = new Endpoint(transportMeta, frozenInput, async (_params: unknown) => []);
		const current = new ContractEndpoint(transportMeta, projection, async () => []);
		for (const sample of [{}, ownKeys, [], [1], null, 'string', 1, true]) {
			const before = structuredClone(sample), after = structuredClone(sample);
			const [oldResult] = await Promise.allSettled([legacy.exec(before, null, null)]);
			const [newResult] = await Promise.allSettled([current.exec(after, null, null)]);
			expect(newResult).toEqual(oldResult);
			expect(after).toEqual(before);
			const parsed = v.safeParse(definition.input, structuredClone(sample));
			expect(parsed.success).toBe(oldResult.status === 'fulfilled');
			if (parsed.success) {
				expect(parsed.output).toEqual(before);
				for (const key of Object.keys(ownKeys)) if (sample === ownKeys) expect(Object.hasOwn(parsed.output, key)).toBe(true);
			}
		}
	}
});

test('actual producers retain URL grouping, descending sort and transport metadata', async () => {
	const deliverJobs = [
		{ data: { to: 'https://one.example/path' } },
		{ data: { to: 'https://two.example/path' } },
		{ data: { to: 'https://two.example/other' } },
		{ data: { to: 'https://one.example:443/other' } },
		{ data: { to: 'https://two.example/third' } },
	];
	const inboxJobs = deliverJobs.map(job => ({ data: { signature: { keyId: job.data.to } } }));
	for (const [implementation, jobs, meta, route] of [
		[DeliverDelayedEndpoint, deliverJobs, deliverMeta, 'admin/queue/deliver-delayed'],
		[InboxDelayedEndpoint, inboxJobs, inboxMeta, 'admin/queue/inbox-delayed'],
	] as const) {
		const queue = { getJobs: vi.fn().mockResolvedValue(jobs) };
		// Reflect.construct supplies the minimal injected queue mock without a payload or dependency cast.
		const endpoint = Reflect.construct(implementation, [queue]);
		expect(await endpoint.exec({}, null, null)).toEqual([['two.example', 3], ['one.example', 2]]);
		expect(queue.getJobs).toHaveBeenCalledExactlyOnceWith(['delayed']);
		const original = rows.find(row => row.route === route)!;
		expect(meta.requireCredential).toBe(true);
		expect(meta.requireModerator).toBe(true);
		expect(meta.kind).toBe('read:admin:queue');
		const { res: nativeResponse, ...nativeMeta } = meta;
		const { res: legacyResponse, ...legacyMeta } = original.meta;
		expect(nativeMeta).toEqual(legacyMeta);
		expect(convertSchemaToOpenApiSchema(nativeResponse!, 'res', true)).toEqual(convertSchemaToOpenApiSchema(legacyResponse!, 'res', true));
	}
});

test('tuple-containing output pipelines permit annotations but reject container semantic replacement', () => {
	const tuple = legacyOutputTuple([v.string(), jsonNumber]);
	const array = v.array(tuple);
	const annotations = { description: 'Host counts.', example: [['example.com', 12]], deprecated: false };
	expect(project(v.pipe(array, v.metadata(annotations))).response).toMatchObject(annotations);
	const containers = [tuple, array, v.nullable(array), resultObject({ counts: array }), v.union([array, v.string()]), v.intersect([resultObject({ counts: array }), resultObject({ other: v.string() })])];
	for (const container of containers) {
		for (const metadata of [{ type: 'object' }, { items: { type: 'string' } }, { nullable: true }, { default: [] }, { minItems: 1 }, { oneOf: [] }]) {
			expect(() => project(v.pipe(container, v.metadata(metadata))))
				.toThrow('Legacy output tuple pipelines require annotation-only metadata');
		}
	}
	// Meaningful metadata on unrelated sibling outputs remains supported.
	const sibling = v.pipe(v.string(), v.metadata({ format: 'misskey:id', default: 'example' }));
	const output = resultObject({ counts: array, sibling });
	expect(project(output).response?.properties?.sibling).toMatchObject({ type: 'string', format: 'misskey:id', default: 'example' });
	// Shared native schemas retain every parent edge, including the later semantic override.
	const shared = v.union([v.pipe(array, v.metadata({ description: 'Safe first use' })), v.pipe(array, v.metadata({ items: { type: 'string' } }))]);
	expect(() => project(shared)).toThrow('Legacy output tuple pipelines require annotation-only metadata');
});

test('supported tuple global definitions fail through the existing reference boundary without recursion', () => {
	const tuple = legacyOutputTuple([v.string(), jsonNumber]);
	const name = 'DelayedTupleGlobalProof';
	const previous = getGlobalDefs()?.[name];
	try {
		addGlobalDefs({ [name]: tuple });
		expect(() => project(tuple)).toThrow('Referenced or tuple response schemas require an explicit legacy projection');
		expect(() => project(v.array(tuple))).toThrow('Referenced or tuple response schemas require an explicit legacy projection');
	} finally {
		const definitions = getGlobalDefs();
		if (definitions) {
			if (previous === undefined) delete definitions[name];
			else definitions[name] = previous;
		}
	}
	expect(project(tuple).response).toEqual({ type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], unevaluatedItems: false });
});

test('unsupported sparse and non-schema item arrays fail before registration', () => {
	expect(() => legacyOutputTuple(new Array<v.StringSchema<undefined>>(2)))
		.toThrow('Legacy output tuples support only bare v.string() and the exact jsonNumber schema');
	expect(() => {
		// @ts-expect-error JavaScript callers cannot register null scalar descriptors.
		return legacyOutputTuple([null, jsonNumber]);
	}).toThrow('Legacy output tuples support only bare v.string() and the exact jsonNumber schema');
});

test('plain and public copied tuple schemas are rejected as unsupported input projections', () => {
	const owned = legacyOutputTuple([v.string(), jsonNumber]);
	const plain = [
		v.tuple([v.string(), jsonNumber]),
		v.strictTuple([v.string(), jsonNumber]),
		v.looseTuple([v.string(), jsonNumber]),
		v.tupleWithRest([v.string(), jsonNumber], v.string()),
	];
	const copied = [v.config(owned, {}), v.message(owned, 'Copied'), ...plain.map(tuple => v.config(tuple, {}))];
	expect(getLegacyOutputTupleItems(copied[0])).toBeUndefined();
	for (const tuple of [...plain, ...copied]) {
		for (const input of [tuple, jsonObject({ pair: tuple }), jsonObject({ pairs: v.array(tuple) }), jsonObject({ pair: v.exactOptional(v.nullable(tuple)) }), jsonObject({ pair: v.pipe(tuple, v.metadata({ description: 'Unsupported tuple input' })) })]) {
			expect(() => projectEndpointContract(defineEndpointContract({ path: '/unsupported-tuple-input' }, input, v.void())))
				.toThrow('Legacy input contracts cannot project tuple schemas');
		}
	}
});
