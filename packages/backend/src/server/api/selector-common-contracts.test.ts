/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import _Ajv from 'ajv';
import * as v from 'valibot';
import { allOfAdminEmojiUpdateDefinition } from '@features/emojis/contract/selector-common-endpoint-definitions.js';
import { allOfNotesSearchByTagDefinition, allOfUsersSearchByUsernameAndHostDefinition } from '@features/discovery/contract/selector-common-endpoint-definitions.js';
import { allOfUsersFollowersDefinition, allOfUsersFollowingDefinition } from '@features/relationships/contract/selector-common-endpoint-definitions.js';
import { misskeyIdPattern } from '@features/api/contract/index.js';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import type { Config } from '@/config.js';
import type { IEndpointMeta } from './endpoints.js';
import documentedEndpoints from './endpoints.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import baseline from '../../../test/fixtures/selector-common-contract-baseline.json' with { type: 'json' };
vi.mock('./endpoints.js', () => ({ default: [] }));
const Ajv = _Ajv.default;
const definitions = {
	'admin/emoji/update': allOfAdminEmojiUpdateDefinition,
	'notes/search-by-tag': allOfNotesSearchByTagDefinition,
	'users/followers': allOfUsersFollowersDefinition,
	'users/following': allOfUsersFollowingDefinition,
	'users/search-by-username-and-host': allOfUsersSearchByUsernameAndHostDefinition,
} as const;
interface Row { route: keyof typeof definitions; input: Schema; meta: IEndpointMeta; }
// Captured schema dialect, never a payload assertion.
const rows = baseline.rows as unknown as readonly Row[];
const meta = { requireCredential: false } as const;
const samples = {
	'admin/emoji/update': [{ id: 'a' }, { name: 'valid_name' }, { id: 'a', name: 'invalid-name!' }, { id: 42, name: 'valid_name' }, { id: 'a', category: null, aliases: ['a', 'a'] }, { id: 'a', category: undefined }, { id: 'a', license: 42 }, {}],
	'notes/search-by-tag': [{ tag: 'a' }, { query: [['a', 'a']] }, { tag: '', query: [['a']] }, { tag: 'a', query: 42 }, { tag: 'a', limit: undefined, reply: undefined }, { tag: 'a', limit: 0 }, { tag: 'a', sinceId: 42 }, { query: [] }, { query: [[]] }, {}],
	'users/followers': [{ userId: 'a' }, { username: 'alice', host: null }, { userId: 42, username: 'alice', host: null }, { userId: 'a', limit: undefined, sinceId: undefined }, { userId: 'a', limit: null }, { username: 'alice' }, {}],
	'users/following': [{ userId: 'a' }, { username: 'alice', host: null }, { userId: 'a', birthday: null }, { userId: 'a', birthday: '2020-99-99' }, { userId: 'a', birthday: '2020-1-2' }, { userId: 'a', birthday: undefined }, {}],
	'users/search-by-username-and-host': [{ username: null }, { host: null }, { username: 42, host: null }, { username: 'alice', host: 'host' }, { host: '', detail: undefined, limit: undefined }, { host: '', detail: null }, {}],
} as const;

test('five projections preserve exact legacy allOf/anyOf structure and complete errors/default mutations', () => {
	for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
		const row = rows.find(r => r.route === route)!;
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
		expect(projection.input).toEqual(row.input);
		expect(projection.input.type).toBeUndefined();
		expect(Object.hasOwn(projection.input.allOf![1], 'required')).toBe(false);
		const ajv = new Ajv({ useDefaults: true }); ajv.addFormat('misskey:id', misskeyIdPattern);
		const old = ajv.compile(row.input), current = ajv.compile(projection.input);
		const poison = JSON.parse('{"constructor":"opaque","__proto__":{"retained":true},"prototype":true,"opaque":{"retained":true}}');
		for (const sample of [...samples[route], { ...samples[route][0], ...poison }, null, true, false, 42, '', [], ['a']]) {
			const before = structuredClone(sample), after = structuredClone(sample);
			const accepted = old(before), errors = structuredClone(old.errors);
			expect(current(after)).toBe(accepted); expect(current.errors).toEqual(errors); expect(after).toEqual(before);
			const nativeInput = structuredClone(sample), untouched = structuredClone(sample);
			const parsed = v.safeParse(definitions[route].input, nativeInput);
			expect(parsed.success).toBe(accepted); expect(nativeInput).toEqual(untouched);
			if (parsed.success) { expect(parsed.output).toEqual(before); expect(Object.getPrototypeOf(parsed.output)).toBe(Object.prototype); }
		}
	}
});

test('selector failure precedes common defaults; common failure retains AJV default timing', async () => {
	const definition = definitions['notes/search-by-tag'];
	const projection = projectEndpointContract(definition);
	const ajv = new Ajv({ useDefaults: true }); ajv.addFormat('misskey:id', misskeyIdPattern);
	const validate = ajv.compile(projection.input);
	const missing = {}; expect(validate(missing)).toBe(false); expect(missing).toEqual({});
	const bad = { tag: 'a', sinceId: 42 }; expect(validate(bad)).toBe(false);
	expect(bad).toEqual({ tag: 'a', sinceId: 42, reply: null, renote: null, withFiles: false, poll: null, limit: 10 });
	expect(validate.errors![0].schemaPath).toBe('#/allOf/1/properties/sinceId/type');
});

function selectorValues(route: keyof typeof definitions, value: unknown): unknown {
	if (value === null || typeof value !== 'object') return value;
	if (route === 'admin/emoji/update') return 'id' in value ? { id: Reflect.get(value, 'id'), name: Reflect.get(value, 'name') } : { name: Reflect.get(value, 'name') };
	if (route === 'notes/search-by-tag') return 'tag' in value ? { tag: Reflect.get(value, 'tag') } : { query: Reflect.get(value, 'query') };
	if (route === 'users/search-by-username-and-host') return { username: Reflect.get(value, 'username'), host: Reflect.get(value, 'host'), limit: Reflect.get(value, 'limit'), detail: Reflect.get(value, 'detail') };
	return 'userId' in value ? { userId: Reflect.get(value, 'userId'), limit: Reflect.get(value, 'limit') } : { username: Reflect.get(value, 'username'), host: Reflect.get(value, 'host'), limit: Reflect.get(value, 'limit') };
}

test('actual transports retain original mixed-selector values, defaulted callbacks and inherited payloads', async () => {
	for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
		const row = rows.find(r => r.route === route)!;
		const seenBefore: unknown[] = [], seenAfter: unknown[] = [], queriesBefore: unknown[] = [], queriesAfter: unknown[] = [];
		const old = new Endpoint(meta, row.input, async (ps: unknown) => { seenBefore.push(ps); queriesBefore.push(selectorValues(route, ps)); });
		const probe = defineEndpointContract({ path: '/selector-common-proof' }, definitions[route].input, v.void());
		const current = new ContractEndpoint<typeof meta, typeof probe.input, typeof probe.output, 'legacy-declared'>(meta, projectEndpointContract(probe), async ps => { seenAfter.push(ps); queriesAfter.push(selectorValues(route, ps)); });
		const mixed = route === 'admin/emoji/update' ? { id: 'a', name: 42 } : route === 'notes/search-by-tag' ? { tag: '', query: [['a']] } : route === 'users/search-by-username-and-host' ? { username: 42, host: null } : { userId: 42, username: 'alice', host: null };
		const prototype = { ...samples[route][0], limit: 7, inheritedOpaque: 'retained' };
		for (const factory of [() => structuredClone(mixed), () => Object.create(prototype)]) {
			const before = factory(), after = factory(); const beforeProto = Object.getPrototypeOf(before), afterProto = Object.getPrototypeOf(after);
			await old.exec(before, null, null); await current.exec(after, null, null);
			expect(seenBefore.at(-1)).toBe(before); expect(seenAfter.at(-1)).toBe(after);
			expect(Object.getPrototypeOf(before)).toBe(beforeProto); expect(Object.getPrototypeOf(after)).toBe(afterProto);
			expect(queriesAfter.at(-1)).toEqual(queriesBefore.at(-1)); expect(after).toEqual(before);
		}
		const native = v.parse(definitions[route].input, Object.create(prototype));
		if (route !== 'admin/emoji/update') expect(Reflect.get(native, 'limit')).toBe(7);
		await expect(old.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(current.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		expect(seenAfter).toHaveLength(2);
	}
});

test('complete OpenAPI retains operations, descriptions, refs, auth/error and 200/204 branches', () => {
	const saved = documentedEndpoints.slice(), config = { version: 'selector-common-proof', apiUrl: 'https://proof.test/api' } as Config;
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(r => ({ name: r.route, meta: r.meta, params: r.input })));
		const old = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, ...Object.entries(definitions).map(([route, definition]) => {
			const row = rows.find(r => r.route === route)!, projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition), { res: _res, ...metadata } = row.meta;
			return { name: route, meta: projection.response ? { ...metadata, res: projection.response } : metadata, params: projection.input };
		}));
		expect(JSON.parse(JSON.stringify(genOpenapiSpec(config)))).toEqual(JSON.parse(JSON.stringify(old)));
	} finally { documentedEndpoints.splice(0, documentedEndpoints.length, ...saved); }
});
