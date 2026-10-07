/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { EntitySchema } from 'typeorm';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import frozen from '../../../test/fixtures/chart-contract-baseline.json' with { type: 'json' };
import { chartEndpointDefinitions, chartInput, instanceChartInput, userChartInput } from '@features/statistics/contract/chart-endpoint-definitions.js';
import type { ChartsEndpoints } from '@features/statistics/contract/chart-endpoint-definitions.js';
import { chartOutputSchema } from '@features/statistics/contract/chart-output-schema.js';
import * as descriptors from '@features/statistics/shared/chart-descriptors.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import documentedEndpoints from './endpoints.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
import * as endpoint0 from '@features/statistics/backend/endpoints/charts/active-users.js';
import * as chartEntity0 from '@features/statistics/backend/charts/definitions/active-users.js';
import * as endpoint1 from '@features/statistics/backend/endpoints/charts/ap-request.js';
import * as chartEntity1 from '@features/statistics/backend/charts/definitions/ap-request.js';
import * as endpoint2 from '@features/statistics/backend/endpoints/charts/drive.js';
import * as chartEntity2 from '@features/statistics/backend/charts/definitions/drive.js';
import * as endpoint3 from '@features/statistics/backend/endpoints/charts/federation.js';
import * as chartEntity3 from '@features/statistics/backend/charts/definitions/federation.js';
import * as endpoint4 from '@features/statistics/backend/endpoints/charts/instance.js';
import * as chartEntity4 from '@features/statistics/backend/charts/definitions/instance.js';
import * as endpoint5 from '@features/statistics/backend/endpoints/charts/notes.js';
import * as chartEntity5 from '@features/statistics/backend/charts/definitions/notes.js';
import * as endpoint6 from '@features/statistics/backend/endpoints/charts/user/drive.js';
import * as chartEntity6 from '@features/statistics/backend/charts/definitions/per-user-drive.js';
import * as endpoint7 from '@features/statistics/backend/endpoints/charts/user/following.js';
import * as chartEntity7 from '@features/statistics/backend/charts/definitions/per-user-following.js';
import * as endpoint8 from '@features/statistics/backend/endpoints/charts/user/notes.js';
import * as chartEntity8 from '@features/statistics/backend/charts/definitions/per-user-notes.js';
import * as endpoint9 from '@features/statistics/backend/endpoints/charts/user/pv.js';
import * as chartEntity9 from '@features/statistics/backend/charts/definitions/per-user-pv.js';
import * as endpoint10 from '@features/statistics/backend/endpoints/charts/user/reactions.js';
import * as chartEntity10 from '@features/statistics/backend/charts/definitions/per-user-reactions.js';
import * as endpoint11 from '@features/statistics/backend/endpoints/charts/users.js';
import * as chartEntity11 from '@features/statistics/backend/charts/definitions/users.js';

// Collection instances are never created. Only the real schemaToEntity metadata generator runs.
vi.mock('@/models/_.js', () => ({ miRepository: {} }));
// Restrict documentation input to these real chart endpoint modules, avoiding unrelated endpoints.
vi.mock('./endpoints.js', () => ({ default: [] }));
vi.mock('@features/statistics/backend/charts/active-users.js', () => ({ ActiveUsersChart: class {} }));
vi.mock('@features/statistics/backend/charts/ap-request.js', () => ({ ApRequestChart: class {} }));
vi.mock('@features/statistics/backend/charts/drive.js', () => ({ DriveChart: class {} }));
vi.mock('@features/statistics/backend/charts/federation.js', () => ({ FederationChart: class {} }));
vi.mock('@features/statistics/backend/charts/instance.js', () => ({ InstanceChart: class {} }));
vi.mock('@features/statistics/backend/charts/notes.js', () => ({ NotesChart: class {} }));
vi.mock('@features/statistics/backend/charts/per-user-drive.js', () => ({ PerUserDriveChart: class {} }));
vi.mock('@features/statistics/backend/charts/per-user-following.js', () => ({ PerUserFollowingChart: class {} }));
vi.mock('@features/statistics/backend/charts/per-user-notes.js', () => ({ PerUserNotesChart: class {} }));
vi.mock('@features/statistics/backend/charts/per-user-pv.js', () => ({ PerUserPvChart: class {} }));
vi.mock('@features/statistics/backend/charts/per-user-reactions.js', () => ({ PerUserReactionsChart: class {} }));
vi.mock('@features/statistics/backend/charts/users.js', () => ({ UsersChart: class {} }));

const rows = [
	{ route: 'charts/active-users', endpoint: endpoint0, entity: chartEntity0, descriptor: descriptors.activeUsersChartDescriptor },
	{ route: 'charts/ap-request', endpoint: endpoint1, entity: chartEntity1, descriptor: descriptors.apRequestChartDescriptor },
	{ route: 'charts/drive', endpoint: endpoint2, entity: chartEntity2, descriptor: descriptors.driveChartDescriptor },
	{ route: 'charts/federation', endpoint: endpoint3, entity: chartEntity3, descriptor: descriptors.federationChartDescriptor },
	{ route: 'charts/instance', endpoint: endpoint4, entity: chartEntity4, descriptor: descriptors.instanceChartDescriptor },
	{ route: 'charts/notes', endpoint: endpoint5, entity: chartEntity5, descriptor: descriptors.notesChartDescriptor },
	{ route: 'charts/user/drive', endpoint: endpoint6, entity: chartEntity6, descriptor: descriptors.perUserDriveChartDescriptor },
	{ route: 'charts/user/following', endpoint: endpoint7, entity: chartEntity7, descriptor: descriptors.perUserFollowingChartDescriptor },
	{ route: 'charts/user/notes', endpoint: endpoint8, entity: chartEntity8, descriptor: descriptors.perUserNotesChartDescriptor },
	{ route: 'charts/user/pv', endpoint: endpoint9, entity: chartEntity9, descriptor: descriptors.perUserPvChartDescriptor },
	{ route: 'charts/user/reactions', endpoint: endpoint10, entity: chartEntity10, descriptor: descriptors.perUserReactionsChartDescriptor },
	{ route: 'charts/users', endpoint: endpoint11, entity: chartEntity11, descriptor: descriptors.usersChartDescriptor },
] as const;

function normalizeMetadata(value: unknown): unknown {
	if (value === undefined) return { $undefined: true };
	if (typeof value === 'bigint') return { $bigint: value.toString() };
	if (typeof value === 'function') return { $function: value.toString() };
	if (typeof value === 'symbol') throw new Error('Unsupported symbol in chart metadata');
	if (value instanceof Date) return { $date: value.toISOString() };
	if (value instanceof RegExp) return { $regexp: value.toString() };
	if (Array.isArray(value)) return value.map(normalizeMetadata);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeMetadata(entry)]));
	}
	if (typeof value === 'number' && !Number.isFinite(value)) return { $number: String(value) };
	return value;
}

function makeEndpoint(row: typeof rows[number], response: unknown, calls: unknown[][]) {
	// Reflection supplies only the chart dependency; no response is cast to a contract type.
	return Reflect.construct(row.endpoint.EndpointImplementation, [{
		getChart: (...args: unknown[]) => { calls.push(args); return Promise.resolve(response); },
	}]);
}

async function outcome(endpoint: { exec: (params: unknown, user: null, token: null) => Promise<unknown> }, params: unknown, response: unknown) {
	try {
		expect(await endpoint.exec(params, null, null)).toBe(response);
		return { valid: true };
	} catch (error) {
		if (!(error instanceof ApiError)) throw error;
		return { valid: false, code: error.code, id: error.id, info: error.info };
	}
}

test('all chart descriptors and their ordered metric options match the frozen baseline', () => {
	expect(rows).toHaveLength(12);
	expect(Object.keys(chartEndpointDefinitions)).toEqual(rows.map(row => row.route));
	for (const row of rows) {
		const old = frozen.routes.find(entry => entry.route === row.route)!;
		expect(row.descriptor).toEqual(old.descriptor);
		expect(Object.keys(row.descriptor)).toEqual(old.descriptorKeyOrder);
		expect(row.entity.schema).toBe(row.descriptor);
		expect(row.entity.name).toBe(old.entityName);
	}
});

test('all 24 real hour/day EntitySchema options remain deterministically equivalent', () => {
	for (const row of rows) {
		const old = frozen.routes.find(entry => entry.route === row.route)!;
		for (const span of ['hour', 'day'] as const) {
			expect(row.entity.entity[span]).toBeInstanceOf(EntitySchema);
			expect(normalizeMetadata(row.entity.entity[span].options)).toEqual(old.entities[span]);
		}
	}
});

test('chart input schemas and every required numeric-series output retain final OpenAPI shape', () => {
	for (const row of rows) {
		const old = frozen.routes.find(entry => entry.route === row.route)!;
		expect(row.endpoint.paramDef).toEqual(old.input);
		const { res: _response, ...meta } = row.endpoint.meta;
		expect(meta).toEqual(old.meta);
		const schema = convertSchemaToOpenApiSchema(row.endpoint.meta.res!, 'res', true);
		expect(schema).toEqual(old.openapi.post.responses['200'].content['application/json'].schema);
	}
});

test('complete published chart GET/POST operations match the frozen OpenAPI oracle', () => {
	documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(row => ({
		name: row.route, meta: row.endpoint.meta, params: row.endpoint.paramDef,
	})));
	const spec = genOpenapiSpec({ version: 'chart-test', apiUrl: 'https://chart.test/api' } as never);
	for (const row of rows) expect(JSON.parse(JSON.stringify(spec.paths['/' + row.route]))).toEqual(
		frozen.routes.find(entry => entry.route === row.route)!.openapi,
	);
});

test('real chart endpoint handlers retain AJV defaults, mutations, errors and original response identity', async () => {
	for (const row of rows) {
		const old = frozen.routes.find(entry => entry.route === row.route)!;
		// Use an independently cloned, typed schema only after checking every value against the frozen baseline.
		const legacyInput = structuredClone(row.endpoint.paramDef);
		expect(legacyInput).toEqual(old.input);
		const required = row.route === 'charts/instance' ? { span: 'day', host: '' }
			: row.route.startsWith('charts/user/') ? { span: 'day', userId: 'user1' } : { span: 'day' };
		const samples: unknown[] = [
			required, { ...required, future: { retained: true } },
			{ ...required, span: 'hour' }, { ...required, limit: 1 }, { ...required, limit: 500 },
			{ ...required, limit: 0 }, { ...required, limit: 501 }, { ...required, limit: 1.5 },
			{ ...required, limit: null }, { ...required, limit: '30' },
			{ ...required, offset: null }, { ...required, offset: 0 }, { ...required, offset: -1 },
			{ ...required, offset: 8640000000000001 },
			{ ...required, offset: Number.MAX_SAFE_INTEGER + 1 },
			{ ...required, offset: -Number.MAX_SAFE_INTEGER - 1 }, { ...required, offset: 1.5 },
			{ ...required, offset: '1' }, { ...required, span: 'week' }, { ...required, span: null },
			{}, null, [], 'day', 1,
		];
		if (row.route === 'charts/instance') samples.push(
			{ ...required, host: 'remote.test' }, { span: 'day' }, { ...required, host: null }, { ...required, host: 1 },
		);
		if (row.route.startsWith('charts/user/')) samples.push(
			{ ...required, userId: 'ABC123' }, { span: 'day' }, { ...required, userId: 'invalid-id' },
			{ ...required, userId: '' }, { ...required, userId: null },
		);
		for (const sample of samples) {
			const response = { deliberatelyMalformedSeries: 'untouched', extension: { retained: true } };
			const calls: unknown[][] = [];
			const current = makeEndpoint(row, response, calls);
			const legacyCalls: unknown[] = [];
			const legacy = new Endpoint({}, legacyInput, async (input: unknown) => { legacyCalls.push(input); return response; });
			const originalParams = structuredClone(sample);
			const currentParams = structuredClone(sample);
			const before = await outcome(legacy, originalParams, response);
			const after = await outcome(current, currentParams, response);
			expect(after).toEqual(before);
			expect(currentParams).toEqual(originalParams);
			expect(calls).toHaveLength(legacyCalls.length);
		}
	}
});

test('chart date and group arguments preserve null, zero, negative and beyond-safe-integer offsets', async () => {
	for (const row of rows) {
		for (const offset of [null, 0, -1, 1700000000000, 8640000000000001, Number.MAX_SAFE_INTEGER + 1, -Number.MAX_SAFE_INTEGER - 1]) {
			const calls: unknown[][] = [];
			const response = {};
			const endpoint = makeEndpoint(row, response, calls);
			const params = { span: 'hour', limit: 2, offset, host: '', userId: 'user1', future: true };
			expect(await endpoint.exec(params, null, null)).toBe(response);
			const expected = [params.span, params.limit, offset ? new Date(offset) : null];
			if (row.route === 'charts/instance') expected.push(params.host);
			if (row.route.startsWith('charts/user/')) expected.push(params.userId);
			expect(calls).toEqual([expected]);
			if (offset !== null && Math.abs(offset) > 8640000000000000) {
				const cursor = calls[0][2];
				if (!(cursor instanceof Date)) throw new Error('Out-of-range offset must remain a Date argument');
				expect(cursor.getTime()).toBeNaN();
			}
		}
	}
});

test('portable Valibot requests preserve defaults and unrestricted host/date semantics', () => {
	expect(v.parse(chartInput, { span: 'day', future: true })).toEqual({ span: 'day', future: true, limit: 30, offset: null });
	expect(v.parse(instanceChartInput, { span: 'day', host: '' }).host).toBe('');
	for (const offset of [8640000000000001, Number.MAX_SAFE_INTEGER + 1, -Number.MAX_SAFE_INTEGER - 1]) {
		expect(v.parse(chartInput, { span: 'hour', offset }).offset).toBe(offset);
	}
	for (const id of ['', 'bad-id', null, 1]) expect(v.safeParse(userChartInput, { span: 'day', userId: id }).success).toBe(false);
	for (const limit of [1, 500]) expect(v.safeParse(chartInput, { span: 'day', limit }).success).toBe(true);
	for (const limit of [0, 501, 1.5]) expect(v.safeParse(chartInput, { span: 'day', limit }).success).toBe(false);
});

test('descriptor builder rejects ambiguous paths and preserves ordered branching', () => {
	const invalidDescriptors: descriptors.ChartMetricDescriptor[] = [{ 'a.': {} }, { '.a': {} }, { a: {}, 'a.b': {} }, { 'a.b': {}, a: {} }];
	for (const descriptor of invalidDescriptors) {
		expect(() => chartOutputSchema(descriptor)).toThrow(/chart metric path/);
	}
	const schema = chartOutputSchema({ 'z.last': {}, first: {}, 'z.next': {} });
	const projection = projectEndpointContract(defineEndpointContract({ path: '/chart-builder' }, chartInput, schema));
	expect(Object.keys(projection.response!.properties!)).toEqual(['z', 'first']);
	expect(v.parse(schema, { z: { last: [], next: [-1, 0.5], extra: true }, first: [], extra: true })).toEqual({
		z: { last: [], next: [-1, 0.5], extra: true }, first: [], extra: true,
	});
	expect(v.safeParse(schema, { first: [] }).success).toBe(false);
	expect(v.safeParse(schema, { z: { last: null, next: [] }, first: [] }).success).toBe(false);
});

test('oRPC chart types infer nested required series without dotted keys or unknown-key widening', () => {
	expectTypeOf<ChartsEndpoints['charts/user/reactions']['res']>().toEqualTypeOf<{ local: { count: number[] }; remote: { count: number[] } }>();
	expectTypeOf<ChartsEndpoints['charts/user/pv']['res']['upv']['user']>().toEqualTypeOf<number[]>();
	expectTypeOf<ChartsEndpoints['charts/instance']['res']['notes']['diffs']['withFile']>().toEqualTypeOf<number[]>();
	expectTypeOf<keyof ChartsEndpoints['charts/user/reactions']['res']>().toEqualTypeOf<'local' | 'remote'>();
	expectTypeOf<ChartsEndpoints['charts/users']['req']['offset']>().toEqualTypeOf<number | null | undefined>();
	expectTypeOf<v.InferOutput<typeof chartInput>['offset']>().toEqualTypeOf<number | null>();
	expectTypeOf<v.InferOutput<typeof chartInput>['limit']>().toEqualTypeOf<number>();
});
