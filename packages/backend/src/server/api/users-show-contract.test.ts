/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import _Ajv from 'ajv';
import * as v from 'valibot';
import { usersShowDefinition } from '../../../../features/users/contract/show-endpoint-definition.js';
import { EndpointImplementation, meta, paramDef } from '../../../../features/users/backend/endpoints/users/show.js';
import { misskeyIdPattern } from '../../../../features/api/contract/index.js';
import { defineEndpointContract } from '../../../../features/api/contract/definition.js';
import type { Config } from '@/config.js';
import type { Schema } from '@/misc/json-schema.js';
import type { IEndpointMeta } from './endpoints.js';
import documentedEndpoints from './endpoints.js';
import { Endpoint } from './endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { genOpenapiSpec } from './openapi/gen-spec.js';
import baseline from '../../../test/fixtures/users-show-contract-baseline.json' with { type: 'json' };

vi.mock('./endpoints.js', () => ({ default: [] }));
vi.mock('../../../../features/users/backend/serializers/UserEntityService.js', () => ({ UserEntityService: class {} }));
vi.mock('../../../../features/federation/backend/services/RemoteUserResolveService.js', () => ({ RemoteUserResolveService: class {} }));
vi.mock('../../../../features/roles/backend/services/RoleService.js', () => ({ RoleService: class {} }));
vi.mock('@/core/chart/charts/per-user-pv.js', () => ({ default: class {} }));
vi.mock('@/server/api/ApiLoggerService.js', () => ({ ApiLoggerService: class {} }));
const Ajv = _Ajv.default;
const projection = projectEndpointContract(usersShowDefinition);
// Captured legacy schema dialects, never request or response payload assertions.
const oldInput = baseline.paramDef as Schema;
const oldMeta = baseline.meta as IEndpointMeta;

function validator(schema: object) {
	const ajv = new Ajv({ useDefaults: true }); ajv.addFormat('misskey:id', misskeyIdPattern);
	return ajv.compile(schema);
}

const samples: unknown[] = [
	{}, { userId: 'Ab12' }, { userIds: [] }, { userIds: ['a', 'A'] }, { userIds: ['a', 'a'] },
	{ username: '' }, { username: ' alice ' }, { userId: 'a', userIds: ['b'], username: 'name' },
	{ userId: 'a', username: 42 }, { userId: 'a', userIds: [1] }, { userIds: ['a'], username: false },
	{ userId: 'a', userIds: null }, { userId: 'a', userIds: undefined },
	{ userId: 'bad-id', userIds: ['a'] }, { userId: 'bad-id', username: 'alice' },
	{ userId: 'a', host: null }, { userId: 'a', host: undefined }, { userId: 'a', host: 42 },
	{ userId: null }, { userId: undefined }, { userIds: [null] }, { userIds: 'a' },
	{ username: null }, { username: undefined }, null, [], ['a'], true, 42, '',
];

test('users/show exact request projection preserves three ordered branches and complete AJV behavior', () => {
	expect(paramDef).toEqual(oldInput); expect(projection.input).toEqual(oldInput);
	expect(Object.hasOwn(projection.input, 'type')).toBe(false);
	expect(Object.hasOwn(projection.input.allOf![1], 'required')).toBe(false);
	const old = validator(oldInput), current = validator(projection.input);
	for (const sample of samples) {
		const before = structuredClone(sample), after = structuredClone(sample), nativeInput = structuredClone(sample);
		const accepted = old(before), errors = structuredClone(old.errors);
		expect(current(after)).toBe(accepted); expect(current.errors).toEqual(errors); expect(after).toEqual(before);
		const parsed = v.safeParse(usersShowDefinition.input, nativeInput);
		expect(parsed.success).toBe(accepted); expect(nativeInput).toEqual(sample);
		if (parsed.success) expect(parsed.output).toEqual(after);
	}
});

test('users/show native parsing retains poison keys, opaque identity, inherited fields and absent host', () => {
	const body = JSON.parse('{"userId":"a","constructor":"opaque","prototype":true,"__proto__":{"retained":true}}');
	const opaque = { identity: true }; body.opaque = opaque;
	const native = v.parse(usersShowDefinition.input, body);
	expect(Object.getPrototypeOf(native)).toBe(Object.prototype);
	expect(Object.hasOwn(native, '__proto__')).toBe(true); expect(native.__proto__).toBe(body.__proto__);
	expect(native.opaque).toBe(opaque); expect(native.constructor).toBe('opaque'); expect(Object.hasOwn(native, 'host')).toBe(false);
	const inherited = Object.create({ username: ' alice ', host: null, inactive: 'ignored' });
	const parsed = v.parse(usersShowDefinition.input, inherited);
	expect(parsed.username).toBe(' alice '); expect(parsed.host).toBeNull(); expect(Object.hasOwn(parsed, 'inactive')).toBe(false);
	const undefinedHost = v.parse(usersShowDefinition.input, { userId: 'a', host: undefined });
	expect(Object.hasOwn(undefinedHost, 'host')).toBe(true); expect(undefinedHost.host).toBeUndefined();
});

test('users/show AJV transports retain original identities, inherited selectors and INVALID_PARAM details', async () => {
	const beforeSeen: unknown[] = [], afterSeen: unknown[] = [];
	const old = new Endpoint({ requireCredential: false }, oldInput, async (value: unknown) => { beforeSeen.push(value); });
	const probe = defineEndpointContract({ path: '/users-show-proof' }, usersShowDefinition.input, v.void());
	const current = new ContractEndpoint({ requireCredential: false }, projectEndpointContract(probe), async value => { afterSeen.push(value); });
	for (const sample of [{ userId: 'a', username: 42 }, { userId: 'a', userIds: [1] }, Object.create({ username: 'alice', host: null })]) {
		await old.exec(sample, null, null); await current.exec(sample, null, null);
		expect(beforeSeen.at(-1)).toBe(sample); expect(afterSeen.at(-1)).toBe(sample);
	}
	const size = beforeSeen.length;
	for (const sample of [{}, { userIds: ['a', 'a'] }, { userId: 'a', host: 42 }]) {
		const before = await old.exec(sample, null, null).catch(error => error);
		const after = await current.exec(sample, null, null).catch(error => error);
		expect(after).toMatchObject({ code: 'INVALID_PARAM', id: before.id, info: before.info });
	}
	expect(beforeSeen).toHaveLength(size); expect(afterSeen).toHaveLength(size);
});

function actualEndpoint() {
	const calls: { kind: string; value: unknown }[] = [];
	const users = [{ id: 'a', host: null, isSuspended: false }, { id: 'b', host: null, isSuspended: false }];
	const repository = {
		findBy: async (value: unknown) => { calls.push({ kind: 'list', value }); return users; },
		findOneBy: async (value: unknown) => { calls.push({ kind: 'scalar', value }); return users[0]; },
	};
	const packer = {
		pack: async (value: unknown, viewer: unknown, options: unknown) => { calls.push({ kind: 'pack', value: { value, viewer, options } }); return value; },
		packMany: async (values: unknown[], viewer: unknown, options: unknown) => { calls.push({ kind: 'packMany', value: { values, viewer, options } }); return values; },
	};
	// Reflect.construct supplies isolated fake dependencies; no request/output payload casts.
	const endpoint: Pick<EndpointImplementation, 'exec'> = Reflect.construct(EndpointImplementation, [
		{ ugcVisibilityForVisitor: 'public' }, repository, packer,
		{ resolveUser: async (username: unknown, host: unknown) => { calls.push({ kind: 'remote', value: { username, host } }); return users[0]; } },
		{ isModerator: async () => false }, { commitByVisitor: () => {}, commitByUser: () => {} },
		{ logger: { warn: () => {} } },
	]);
	return { endpoint, calls };
}

test('users/show actual unchanged handler retains list precedence, sorting, trim and legacy inactive-extra crashes', async () => {
	const { endpoint, calls } = actualEndpoint();
	const mixed = { userId: 'a', userIds: ['b', 'a'], username: ' alice ' };
	await expect(endpoint.exec(mixed, null, null)).resolves.toMatchObject([{ id: 'b' }, { id: 'a' }]);
	expect(mixed.username).toBe('alice'); expect(calls[0].kind).toBe('list');
	await expect(endpoint.exec({ userIds: [] }, null, null)).resolves.toEqual([]);
	await expect(endpoint.exec({ userId: 'a', username: 42 }, null, null)).rejects.toBeInstanceOf(TypeError);
	for (const inactiveIds of [null, undefined]) {
		await expect(endpoint.exec({ userId: 'a', userIds: inactiveIds }, null, null)).rejects.toBeInstanceOf(TypeError);
	}
	const count = calls.length;
	await expect(endpoint.exec({ userId: 'a', userIds: [1] }, null, null)).resolves.toEqual([]);
	expect(calls[count].kind).toBe('list');
	const inOperator = Reflect.get(calls[count].value as object, 'id');
	expect(Reflect.get(inOperator, '_value')).toEqual([1]);
	await endpoint.exec({ userId: 'a', username: ' Alice ', host: 'remote.test' }, null, null);
	expect(calls.find(call => call.kind === 'remote')!.value).toEqual({ username: 'Alice', host: 'remote.test' });
	await endpoint.exec({ userId: 'a', username: 'alice', host: null }, null, null);
	expect(calls.filter(call => call.kind === 'scalar').at(-1)!.value).toEqual({ id: 'a' });
});

test('users/show preserves complete OpenAPI and documents the native scalar/list response union', () => {
	const { res: _oldResponse, ...oldMetadata } = oldMeta;
	const { res: _currentResponse, ...currentMetadata } = meta;
	expect(currentMetadata).toEqual(oldMetadata);
	const saved = documentedEndpoints.slice(), config = { version: 'users-show-proof', apiUrl: 'https://proof.test/api' } as Config;
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, { name: 'users/show', meta: oldMeta, params: oldInput });
		const old = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, { name: 'users/show', meta, params: paramDef });
		expect(JSON.parse(JSON.stringify(genOpenapiSpec(config)))).toEqual(JSON.parse(JSON.stringify(old)));
		expect(projection.response).toEqual({ oneOf: [{ type: 'object', ref: 'UserDetailed' }, { type: 'array', items: { type: 'object', ref: 'UserDetailed' } }] });
	} finally { documentedEndpoints.splice(0, documentedEndpoints.length, ...saved); }
});
