/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { compositionApShowDefinition, compositionApShowInput, compositionApShowOutput } from '../../../../features/federation/contract/output-composition-endpoint-definitions.js';
import { compositionAdminAccountsCreateDefinition, compositionAdminAccountsCreateInput, compositionAdminAccountsCreateOutput } from '../../../../features/auth/contract/output-composition-endpoint-definitions.js';
import { compositionUsersListsShowDefinition, compositionUsersListsShowInput, compositionUsersListsShowOutput } from '../../../../features/relationships/contract/output-composition-endpoint-definitions.js';
import type { OutputCompositionEndpoints as FederationCompositionEndpoints } from '../../../../features/federation/contract/output-composition-endpoint-definitions.js';
import type { OutputCompositionEndpoints as AuthCompositionEndpoints } from '../../../../features/auth/contract/output-composition-endpoint-definitions.js';
import type { OutputCompositionEndpoints as RelationshipCompositionEndpoints } from '../../../../features/relationships/contract/output-composition-endpoint-definitions.js';
import { localUsernameSchema, passwordSchema } from '../../../../features/users/contract/user-credentials.js';
import { packedSchemas } from '../../../../features/index/contract/packed.js';
import type { Packed } from '../../../../features/index/contract/packed.js';
import type { Schema } from '@/misc/json-schema.js';
import type { Config } from '@/config.js';
import type { IEndpointMeta } from './endpoints.js';
import documentedEndpoints from './endpoints.js';
import { Endpoint } from './endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';
import { genOpenapiSpec } from './openapi/gen-spec.js';
import baseline from '../../../test/fixtures/output-composition-contract-baseline.json' with { type: 'json' };

vi.mock('./endpoints.js', () => ({ default: [] }));
const definitions = {
	'ap/show': compositionApShowDefinition,
	'admin/accounts/create': compositionAdminAccountsCreateDefinition,
	'users/lists/show': compositionUsersListsShowDefinition,
} as const;
const transportMeta = { requireCredential: false } as const;

interface FrozenSchemaRow {
	route: keyof typeof definitions;
	input: Schema;
	output: Schema;
	meta: IEndpointMeta;
}
// The generator snapshots legacy schema ASTs; this assertion is not for runtime payloads.
const frozenRows = baseline.rows as unknown as readonly FrozenSchemaRow[];

// Assertions bridge only the frozen legacy schema dialect, never payloads.
function oldInput(route: string): Schema {
	return frozenRows.find(row => row.route === route)!.input as Schema;
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value)
			.filter(([key, member]) => !(key === 'additionalProperties' && member === true))
			.map(([key, member]) => [key, canonical(member)]));
	}
	return value;
}

test('credential leaves retain exact username pattern and password length', () => {
	expect(localUsernameSchema).toEqual({ type: 'string', pattern: '^\\w{1,20}$' });
	expect(passwordSchema).toEqual({ type: 'string', minLength: 1 });
	expect(projectEndpointContract(compositionAdminAccountsCreateDefinition).input.properties!.username).toEqual(localUsernameSchema);
	expect(projectEndpointContract(compositionAdminAccountsCreateDefinition).input.properties!.password).toEqual(passwordSchema);
});

describe('three output-composition projections', () => {
	for (const [route, definition] of Object.entries(definitions)) {
		test(route, () => {
			const row = frozenRows.find(value => value.route === route)!;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			expect(canonical(projection.input)).toEqual(row.input);
			expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true))
				.toEqual(convertSchemaToOpenApiSchema(row.output as Schema, 'res', true));
		});
	}
});

test('ap/show retains ordered tagged oneOf with no root object type', () => {
	const response = projectEndpointContract(compositionApShowDefinition).response!;
	expect(response.type).toBeUndefined();
	expect(response.oneOf).toHaveLength(2);
	expect(response.anyOf).toBeUndefined();
	expect(response.oneOf!.map(branch => branch.properties!.type.enum)).toEqual([['User'], ['Note']]);
	expect(response.oneOf!.map(branch => branch.properties!.object.ref)).toEqual(['UserDetailedNotMe', 'Note']);
});

test('allOf retains explicit root object and optional list extensions', () => {
	const account = projectEndpointContract(compositionAdminAccountsCreateDefinition).response!;
	const list = projectEndpointContract(compositionUsersListsShowDefinition).response!;
	expect(account.type).toBe('object');
	expect(list.type).toBe('object');
	expect(account.allOf).toHaveLength(2);
	expect(list.allOf).toHaveLength(2);
	expect(account.allOf![1].properties!.token.optional).toBe(false);
	expect(list.allOf![1].properties!.likedCount.optional).toBe(true);
	expect(list.allOf![1].properties!.isLiked.optional).toBe(true);
});

test('packed compositions keep canonical validation', () => {
	const value: Packed<'UserList'> = { id: 'list1', createdAt: '2026-10-07T00:00:00Z', name: 'List', userIds: [], isPublic: true };
	expect(v.is(packedSchemas.UserList, value)).toBe(true);
	expect(v.safeParse(compositionUsersListsShowOutput, value).success).toBe(true);
	expect(v.safeParse(compositionUsersListsShowOutput, { ...value, likedCount: 1, isLiked: false, extension: true }).success).toBe(true);
	expect(v.safeParse(compositionUsersListsShowOutput, { ...value, likedCount: null }).success).toBe(false);
	expect(v.safeParse(compositionUsersListsShowOutput, { ...value, isLiked: 'false' }).success).toBe(false);
	expect(v.safeParse(compositionApShowOutput, { type: 'User', object: {} }).success).toBe(false);
	expect(v.safeParse(compositionApShowOutput, { type: 'Other', object: value }).success).toBe(false);
	expect(v.safeParse(compositionAdminAccountsCreateOutput, { token: 'secret' }).success).toBe(false);
});

test('bridge returns original responses and extensions without output parsing', async () => {
	for (const definition of Object.values(definitions)) {
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
		const response = { deliberateNonCanonicalTestPayload: true, extension: { retained: true } };
		const endpoint = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async () => response);
		const input = definition === compositionApShowDefinition ? { uri: 'https://example.test/note' }
			: definition === compositionAdminAccountsCreateDefinition ? { username: 'alice', password: 'secret' }
				: { listId: 'list1' };
		expect(await endpoint.exec(input, null, null)).toBe(response);
	}
});

test('native validation matches legacy AJV defaults, errors and unknown own keys', async () => {
	const ownKeys = JSON.parse('{"__proto__":{"retained":true},"constructor":{"retained":true},"prototype":true,"__defineGetter__":"retained","toString":"retained","hasOwnProperty":"retained","future":{"retained":true}}');
	const samples = {
		'ap/show': [{ uri: '' }, { uri: 'https://example.test/note' }, {}, { uri: null }, { uri: 1 }],
		'admin/accounts/create': [
			{ username: 'alice', password: 'secret' }, { username: '_0', password: '𐀀' },
			{ username: 'a'.repeat(20), password: '🔒', setupPassword: null },
			{ username: 'alice\n', password: 'x', setupPassword: '' },
			{ username: '', password: 'x' }, { username: 'a'.repeat(21), password: 'x' },
			{ username: 'é', password: 'x' }, { username: '𐀀', password: 'x' },
			{ username: 'alice', password: '' }, { username: 'alice' }, { password: 'x' },
			{ username: null, password: 'x' }, { username: 'alice', password: null },
			{ username: 'alice', password: 'x', setupPassword: 1 },
		],
		'users/lists/show': [
			{ listId: 'list1' }, { listId: 'list1', forPublic: true }, { listId: 'list1', forPublic: false },
			{}, { listId: 'bad-id' }, { listId: null }, { listId: 'list1', forPublic: null },
			{ listId: 'list1', forPublic: 'true' },
		],
	} as const;
	for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
		const definition = definitions[route];
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
		const response = { untouched: true };
		const old = new Endpoint(transportMeta, oldInput(route), async (_params: unknown) => response);
		const current = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async () => response);
		const valid = samples[route][0];
		for (const sample of [...samples[route], { ...valid, ...ownKeys }, [], [valid], null, 'string', 1, true]) {
			const before = structuredClone(sample);
			const after = structuredClone(sample);
			const [legacy] = await Promise.allSettled([old.exec(before, null, null)]);
			const [bridge] = await Promise.allSettled([current.exec(after, null, null)]);
			expect(bridge).toEqual(legacy);
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

test('actual writer preserves complete document, auth, errors and response branches', () => {
	const saved = documentedEndpoints.slice();
	const config = { version: 'output-composition-test', apiUrl: 'https://composition.test/api' } as Config;
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...frozenRows.map(row => ({
			name: row.route, meta: row.meta as IEndpointMeta, params: row.input as Schema,
		})));
		const original = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, ...Object.entries(definitions).map(([route, definition]) => {
			const row = frozenRows.find(value => value.route === route)!;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			const { res: _response, ...metadata } = row.meta;
			return { name: route, meta: { ...metadata, res: projection.response } as IEndpointMeta, params: projection.input };
		}));
		const current = genOpenapiSpec(config);
		expect(JSON.parse(JSON.stringify(current))).toEqual(JSON.parse(JSON.stringify(original)));
		expect(genOpenapiSpec(config)).toEqual(current);
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});

test('native inference retains discriminator, intersections and request optionality', () => {
	type ApOutput = v.InferOutput<typeof compositionApShowOutput>;
	type UserBranch = Extract<ApOutput, { type: 'User' }>;
	type NoteBranch = Extract<ApOutput, { type: 'Note' }>;
	expectTypeOf<UserBranch['object']>().toEqualTypeOf<Packed<'UserDetailedNotMe'>>();
	expectTypeOf<NoteBranch['object']>().toEqualTypeOf<Packed<'Note'>>();
	expectTypeOf<FederationCompositionEndpoints['ap/show']['res']>().toEqualTypeOf<ApOutput>();
	expectTypeOf<AuthCompositionEndpoints['admin/accounts/create']['res']>().toEqualTypeOf<Packed<'MeDetailed'> & { token: string } & object>();
	expectTypeOf<RelationshipCompositionEndpoints['users/lists/show']['res']>().toEqualTypeOf<Packed<'UserList'> & { likedCount?: number; isLiked?: boolean } & object>();
	expectTypeOf<v.InferOutput<typeof compositionApShowInput>['uri']>().toEqualTypeOf<string>();
	expectTypeOf<v.InferOutput<typeof compositionAdminAccountsCreateInput>['username']>().toEqualTypeOf<string>();
	expectTypeOf<v.InferInput<typeof compositionUsersListsShowInput>['forPublic']>().toEqualTypeOf<boolean | undefined>();
	expectTypeOf<v.InferOutput<typeof compositionUsersListsShowInput>['forPublic']>().toEqualTypeOf<boolean>();
});
