/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import _Ajv from 'ajv';
import * as v from 'valibot';
import { selectorAdminDriveShowFileDefinition, selectorAdminDriveShowFileInput, selectorAdminDriveShowFileOutput, selectorDriveFilesShowDefinition, selectorDriveFilesShowInput } from '../../../../features/drive/contract/selector-endpoint-definitions.js';
import { selectorIRevokeTokenDefinition, selectorIRevokeTokenInput } from '../../../../features/auth/contract/selector-endpoint-definitions.js';
import { selectorPagesShowDefinition, selectorPagesShowInput } from '../../../../features/pages/contract/selector-endpoint-definitions.js';
import { defineEndpointContract } from '../../../../features/api/contract/definition.js';
import { misskeyIdPattern } from '../../../../features/api/contract/index.js';
import type { Schema } from '@/misc/json-schema.js';
import type { Config } from '@/config.js';
import type { IEndpointMeta } from './endpoints.js';
import documentedEndpoints from './endpoints.js';
import { Endpoint } from './endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';
import { genOpenapiSpec } from './openapi/gen-spec.js';
import baseline from '../../../test/fixtures/selector-contract-baseline.json' with { type: 'json' };

vi.mock('./endpoints.js', () => ({ default: [] }));
const Ajv = _Ajv.default;
const definitions = {
	'admin/drive/show-file': selectorAdminDriveShowFileDefinition,
	'drive/files/show': selectorDriveFilesShowDefinition,
	'i/revoke-token': selectorIRevokeTokenDefinition,
	'pages/show': selectorPagesShowDefinition,
} as const;
const transportMeta = { requireCredential: false } as const;
interface FrozenRow {
	route: keyof typeof definitions;
	input: Schema;
	output: Schema | null;
	meta: IEndpointMeta;
}
// This assertion bridges the captured schema dialect, never request or response data.
const frozenRows = baseline.rows as unknown as readonly FrozenRow[];
const oldInput = (route: keyof typeof definitions) => frozenRows.find(row => row.route === route)!.input;

describe('root-anyOf selector projections', () => {
	for (const [route, definition] of Object.entries(definitions)) {
		test(route, () => {
			const row = frozenRows.find(value => value.route === route)!;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			expect(projection.input).toEqual(row.input);
			expect(projection.input.type).toBeUndefined();
			expect(projection.input.anyOf).toHaveLength(2);
			expect(projection.input.allOf).toBeUndefined();
			if (row.output) {
				expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true))
					.toEqual(convertSchemaToOpenApiSchema(row.output, 'res', true));
			} else expect(projection.response).toBeUndefined();
		});
	}
});

test('native unions and original AJV retain branch acceptance, order, null and unknown own keys', () => {
	const samples = {
		'admin/drive/show-file': [{ fileId: 'abc' }, { url: '' }, { fileId: 'abc', url: 'ok' }, { fileId: 42, url: 'ok' }, { fileId: 'abc', url: 42 }, {}, { fileId: 'bad-id' }, { url: null }],
		'drive/files/show': [{ fileId: 'abc' }, { url: '' }, { fileId: 'abc', url: 'ok' }, { fileId: 42, url: 'ok' }, { fileId: 'abc', url: 42 }, {}, { fileId: 'bad-id' }, { url: null }],
		'i/revoke-token': [{ tokenId: 'abc' }, { token: null }, { token: '' }, { tokenId: 42, token: null }, { tokenId: 'abc', token: 42 }, {}, { token: 42 }, { tokenId: null }],
		'pages/show': [{ pageId: 'abc' }, { name: 'page', username: 'alice' }, { pageId: 42, name: 'page', username: 'alice' }, { pageId: 'abc', name: 42, username: null }, {}, { name: 'page' }, { username: 'alice' }, { pageId: 'bad-id' }],
	} as const;
	const poison = JSON.parse('{"constructor":"opaque","__proto__":{"retained":true},"prototype":true,"extra":{"retained":true}}');
	for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
		const definition = definitions[route];
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
		const ajv = new Ajv({ useDefaults: true });
		ajv.addFormat('misskey:id', misskeyIdPattern);
		const old = ajv.compile(oldInput(route));
		const current = ajv.compile(projection.input);
		for (const sample of [...samples[route], { ...samples[route][0], ...poison }, null, true, false, 42, '', [], ['abc']]) {
			const before = structuredClone(sample);
			const after = structuredClone(sample);
			const oldAccepted = old(before);
			const oldErrors = structuredClone(old.errors);
			const accepted = current(after);
			expect(accepted).toBe(oldAccepted);
			expect(current.errors).toEqual(oldErrors);
			expect(after).toEqual(before);
			const parsed = v.safeParse(definition.input, sample);
			expect(parsed.success).toBe(oldAccepted);
			if (parsed.success) {
				expect(parsed.output).toEqual(before);
				if (sample !== null && typeof sample === 'object') {
					for (const key of Object.keys(sample)) expect(Object.hasOwn(parsed.output, key)).toBe(true);
				}
			}
		}
	}
});

test('actual Endpoint callbacks receive the same original mixed, undefined and inherited values', async () => {
	const mixed = {
		'admin/drive/show-file': () => ({ fileId: 42, url: 'ok', extra: { opaque: true } }),
		'drive/files/show': () => ({ fileId: 42, url: 'ok', extra: { opaque: true } }),
		'i/revoke-token': () => ({ tokenId: 42, token: null, extra: { opaque: true } }),
		'pages/show': () => ({ pageId: 42, name: 'page', username: 'alice', extra: { opaque: true } }),
	};
	const inherited = {
		'admin/drive/show-file': () => Object.create({ fileId: 'abc', extra: 'inherited' }),
		'drive/files/show': () => Object.create({ fileId: 'abc', extra: 'inherited' }),
		'i/revoke-token': () => Object.create({ token: null, extra: 'inherited' }),
		'pages/show': () => Object.create({ name: 'page', username: 'alice', extra: 'inherited' }),
	};
	const undefinedValues = {
		'admin/drive/show-file': () => ({ fileId: undefined, url: 'ok' }),
		'drive/files/show': () => ({ fileId: undefined, url: 'ok' }),
		'i/revoke-token': () => ({ tokenId: undefined, token: null }),
		'pages/show': () => ({ pageId: undefined, name: 'page', username: 'alice' }),
	};
	for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
		const probe = defineEndpointContract({ path: `/${route}` }, definitions[route].input, v.void());
		const legacyCallback = vi.fn(async (_params: unknown) => {});
		const callback = vi.fn(async (_params: unknown) => {});
		const old = new Endpoint(transportMeta, oldInput(route), legacyCallback);
		const current = new ContractEndpoint<typeof transportMeta, typeof probe.input, typeof probe.output, 'legacy-declared'>(transportMeta, projectEndpointContract(probe), callback);
		for (const factory of [mixed[route], inherited[route], undefinedValues[route]]) {
			const before = factory();
			const after = factory();
			const beforePrototype = Object.getPrototypeOf(before);
			const afterPrototype = Object.getPrototypeOf(after);
			await old.exec(before, null, null);
			await current.exec(after, null, null);
			expect(legacyCallback.mock.lastCall![0]).toBe(before);
			expect(callback.mock.lastCall![0]).toBe(after);
			expect(after).toEqual(before);
			expect(Object.getPrototypeOf(before)).toBe(beforePrototype);
			expect(Object.getPrototypeOf(after)).toBe(afterPrototype);
			expect(Object.keys(after)).toEqual(Object.keys(before));
			if (Object.hasOwn(after, 'extra')) expect(callback.mock.lastCall![0]).toHaveProperty('extra', after.extra);
		}
		await expect(old.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(current.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		expect(callback).toHaveBeenCalledTimes(3);
	}
});

test('legacy declared mode preserves the existing presence-based query assumption without sanitizing it', async () => {
	const originalInput = {
		anyOf: [
			{ type: 'object', properties: { fileId: { type: 'string', format: 'misskey:id' } }, required: ['fileId'] },
			{ type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
		],
	} as const;
	for (const input of [selectorAdminDriveShowFileInput, selectorDriveFilesShowInput]) {
		const oldQueries: unknown[] = [];
		const queries: unknown[] = [];
		const old = new Endpoint(transportMeta, originalInput, async (ps: { fileId: string } | { url: string }) => {
			oldQueries.push('fileId' in ps ? { id: ps.fileId } : [{ url: ps.url }, { webpublicUrl: ps.url }, { thumbnailUrl: ps.url }]);
		});
		const probe = defineEndpointContract({ path: '/selector-query-proof' }, input, v.void());
		const current = new ContractEndpoint<typeof transportMeta, typeof input, typeof probe.output, 'legacy-declared'>(transportMeta, projectEndpointContract(probe), async ps => {
			queries.push('fileId' in ps ? { id: ps.fileId } : [{ url: ps.url }, { webpublicUrl: ps.url }, { thumbnailUrl: ps.url }]);
		});
		for (const payload of [{ fileId: 42, url: 'ok' }, { fileId: undefined, url: 'ok' }, { fileId: 'abc', url: 42 }]) {
			await old.exec(payload, null, null);
			await current.exec(payload, null, null);
		}
		expect(queries).toEqual(oldQueries);
		expect(queries).toEqual([{ id: 42 }, { id: undefined }, { id: 'abc' }]);
	}
});

test('named-page and token probes retain mixed-selector callback values', async () => {
	const oldPageQueries: unknown[] = [];
	const pageQueries: unknown[] = [];
	const originalPageInput = {
		anyOf: [
			{ type: 'object', properties: { pageId: { type: 'string', format: 'misskey:id' } }, required: ['pageId'] },
			{ type: 'object', properties: { name: { type: 'string' }, username: { type: 'string' } }, required: ['name', 'username'] },
		],
	} as const;
	const oldPage = new Endpoint(transportMeta, originalPageInput, async (ps: { pageId: string } | { name: string; username: string }) => {
		oldPageQueries.push('pageId' in ps ? { id: ps.pageId } : { name: ps.name, username: ps.username });
	});
	const pageProbe = defineEndpointContract({ path: '/page-selector-proof' }, selectorPagesShowInput, v.void());
	const page = new ContractEndpoint<typeof transportMeta, typeof selectorPagesShowInput, typeof pageProbe.output, 'legacy-declared'>(transportMeta, projectEndpointContract(pageProbe), async ps => {
		pageQueries.push('pageId' in ps ? { id: ps.pageId } : { name: ps.name, username: ps.username });
	});
	await oldPage.exec({ pageId: 42, name: 'page', username: 'alice' }, null, null);
	await page.exec({ pageId: 42, name: 'page', username: 'alice' }, null, null);
	expect(pageQueries).toEqual(oldPageQueries);
	expect(pageQueries).toEqual([{ id: 42 }]);
	const oldTokenQueries: unknown[] = [];
	const tokenQueries: unknown[] = [];
	const originalTokenInput = {
		anyOf: [
			{ type: 'object', properties: { tokenId: { type: 'string', format: 'misskey:id' } }, required: ['tokenId'] },
			{ type: 'object', properties: { token: { type: 'string', nullable: true } }, required: ['token'] },
		],
	} as const;
	const oldToken = new Endpoint(transportMeta, originalTokenInput, async (ps: { tokenId: string } | { token: string | null }) => {
		oldTokenQueries.push('tokenId' in ps ? { id: ps.tokenId } : { token: ps.token });
	});
	const tokenProbe = defineEndpointContract({ path: '/token-selector-proof' }, selectorIRevokeTokenInput, v.void());
	const token = new ContractEndpoint<typeof transportMeta, typeof selectorIRevokeTokenInput, typeof tokenProbe.output, 'legacy-declared'>(transportMeta, projectEndpointContract(tokenProbe), async ps => {
		tokenQueries.push('tokenId' in ps ? { id: ps.tokenId } : { token: ps.token });
	});
	await oldToken.exec({ tokenId: 42, token: null }, null, null);
	await token.exec({ tokenId: 42, token: null }, null, null);
	expect(tokenQueries).toEqual(oldTokenQueries);
	expect(tokenQueries).toEqual([{ id: 42 }]);
});

test('input-view mode does not relax static-projection rejection or parse output responses', async () => {
	const invalid = defineEndpointContract({ path: '/bad-selector' }, v.pipe(v.unknown(), v.check(() => true)), v.void());
	expect(() => projectEndpointContract(invalid)).toThrow(/unregistered validation predicates/);
	const nativeInvalid = v.safeParse(selectorDriveFilesShowInput, { fileId: 42 });
	expect(nativeInvalid.success).toBe(false);
	const output = { untouched: true };
	const probe = defineEndpointContract({ path: '/response-proof' }, selectorDriveFilesShowInput, v.unknown());
	const endpoint = new ContractEndpoint<typeof transportMeta, typeof probe.input, typeof probe.output, 'legacy-declared'>(transportMeta, projectEndpointContract(probe), async () => output);
	expect(await endpoint.exec({ url: 'ok' }, null, null)).toBe(output);
});

test('actual writer preserves the complete OpenAPI document, refs, auth, errors and 200/204 branches', () => {
	const saved = documentedEndpoints.slice();
	const config = { version: 'selector-proof', apiUrl: 'https://selector.test/api' } as Config;
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...frozenRows.map(row => ({ name: row.route, meta: row.meta, params: row.input })));
		const original = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, ...Object.entries(definitions).map(([route, definition]) => {
			const row = frozenRows.find(value => value.route === route)!;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			const { res: _response, ...metadata } = row.meta;
			return { name: route, meta: projection.response ? { ...metadata, res: projection.response } : metadata, params: projection.input };
		}));
		const current = genOpenapiSpec(config);
		expect(JSON.parse(JSON.stringify(current))).toEqual(JSON.parse(JSON.stringify(original)));
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});

test('opaque request headers preserve populated values and object identity without filtering', async () => {
	const opaque = { nested: ['retained'] };
	const headers = { 'x-example': 'retained', 'x-extension': opaque, 'x-counter': 42, constructor: 'opaque' };
	const output = selectorAdminDriveShowFileOutput.entries.requestHeaders;
	expect(v.parse(output, headers)).toBe(headers);
	expect(headers['x-extension']).toBe(opaque);
	expect(v.parse(output, null)).toBeNull();
	expect(v.safeParse(output, []).success).toBe(false);
	const probe = defineEndpointContract({ path: '/opaque-header-proof' }, selectorAdminDriveShowFileInput, output);
	const endpoint = new ContractEndpoint<typeof transportMeta, typeof probe.input, typeof output, 'legacy-declared'>(transportMeta, projectEndpointContract(probe), async () => headers);
	expect(await endpoint.exec({ url: 'ok' }, null, null)).toBe(headers);
});
