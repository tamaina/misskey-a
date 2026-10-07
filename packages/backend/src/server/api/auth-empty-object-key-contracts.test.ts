/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import Fastify from 'fastify';
import type { Config } from '@/config.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import type { IEndpointMeta } from './endpoints.js';
import frozen from '../../../test/fixtures/auth-empty-object-key-contract-baseline.json' with { type: 'json' };
import { emptyObjectKeyEndpointDefinitions as definitions, emptyObjectI2faRemoveKeyInput, emptyObjectI2faRemoveKeyOutput, emptyObjectI2faUpdateKeyInput, emptyObjectI2faUpdateKeyOutput } from '@features/auth/contract/empty-object-key-endpoint-definitions.js';
import { EndpointImplementation as RemoveEndpoint, meta as removeMeta, paramDef as removeParams } from '@features/auth/backend/endpoints/i/2fa/remove-key.js';
import { EndpointImplementation as UpdateEndpoint, meta as updateMeta, paramDef as updateParams } from '@features/auth/backend/endpoints/i/2fa/update-key.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { ApiCallService } from '@features/api/backend/transport/ApiCallService.js';
import documentedEndpoints from './endpoints.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';

vi.mock('./endpoints.js', () => ({ default: [] }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(async (password: string) => password === 'correct') } }));
vi.mock('../../../../features/users/backend/serializers/UserEntityService.js', () => ({ UserEntityService: class {} }));
vi.mock('../../../../features/runtime/backend/services/GlobalEventService.js', () => ({ GlobalEventService: class {} }));
vi.mock('../../../../features/auth/backend/services/UserAuthService.js', () => ({ UserAuthService: class {} }));
vi.mock('../../../../features/roles/backend/services/RoleService.js', () => ({ RoleService: class {} }));
vi.mock('../../../../features/statistics/backend/services/TelemetryService.js', () => ({ TelemetryService: class {} }));
vi.mock('@features/api/backend/transport/RateLimiterService.js', () => ({ RateLimiterService: class {} }));
vi.mock('@features/api/backend/transport/ApiLoggerService.js', () => ({ ApiLoggerService: class {} }));
vi.mock('@features/auth/backend/transport/AuthenticateService.js', () => ({ AuthenticateService: class {}, AuthenticationError: class extends Error {} }));

const me = { id: 'Owner1' };
// This assertion types frozen schema AST/metadata, never request or response payloads.
const rows = frozen.routes as unknown as { route: 'i/2fa/remove-key' | 'i/2fa/update-key'; meta: IEndpointMeta; input: Schema }[];
const canonical = (value: unknown) => JSON.parse(JSON.stringify(value));

function dependencies(enabled = false, keyUserId: string | null = me.id, keyCount = 0) {
	const packed = { id: me.id, secretSentinel: true };
	const profiles = { findOneByOrFail: vi.fn(async () => ({ password: 'hash', twoFactorEnabled: enabled })), update: vi.fn(async () => {}) };
	const keys = {
		delete: vi.fn(async () => {}), count: vi.fn(async () => keyCount), update: vi.fn(async () => {}),
		findOneBy: vi.fn(async () => keyUserId === null ? null : { id: 'cred-_=', userId: keyUserId }),
	};
	const users = { pack: vi.fn(async () => packed) };
	const auth = { twoFactorAuthenticate: vi.fn(async (_profile: unknown, token: string) => { if (token !== '123456') throw new Error('invalid TOTP'); }) };
	const events = { publishMainStream: vi.fn() };
	return { packed, profiles, keys, users, auth, events };
}

function removeEndpoint(deps = dependencies()) {
	// Repository/service test doubles are injected directly; no real credential side effects occur.
	return { endpoint: Reflect.construct(RemoveEndpoint, [deps.keys, deps.profiles, deps.users, deps.auth, deps.events]) as InstanceType<typeof RemoveEndpoint>, deps };
}

function updateEndpoint(deps = dependencies()) {
	return { endpoint: Reflect.construct(UpdateEndpoint, [deps.keys, deps.users, deps.events]) as InstanceType<typeof UpdateEndpoint>, deps };
}

function exec(endpoint: RemoveEndpoint | UpdateEndpoint, body: unknown) {
	return Reflect.apply(endpoint.exec, endpoint, [body, me, null]);
}

function errorInfo(error: unknown) {
	if (error instanceof ApiError) return { code: error.code, id: error.id, message: error.message, info: error.info };
	if (error instanceof Error) return { message: error.message };
	return error;
}

for (const row of rows) {
	test(`${row.route}: projection preserves exact request and metadata leaves res absent`, () => {
		const definition = row.route === 'i/2fa/remove-key' ? definitions['i/2fa/remove-key'] : definitions['i/2fa/update-key'];
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
		expect(canonical(projection.input)).toEqual(row.input);
		expect(canonical(row.route === 'i/2fa/remove-key' ? removeMeta : updateMeta)).toEqual(row.meta);
		expect(Object.hasOwn(row.route === 'i/2fa/remove-key' ? removeMeta : updateMeta, 'res')).toBe(false);
		expect(projection.response).toEqual({ type: 'object' });
	});
}

test('real OpenAPI writer preserves the full document and 204-only documentation', () => {
	const saved = documentedEndpoints.slice();
	try {
		const config = { version: 'auth-empty-object-proof', apiUrl: 'https://auth-empty-object.test/api' } as Config;
		documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(row => ({ name: row.route, meta: row.meta, params: row.input })));
		const before = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length,
			{ name: 'i/2fa/remove-key', meta: removeMeta, params: removeParams },
			{ name: 'i/2fa/update-key', meta: updateMeta, params: updateParams });
		const after = genOpenapiSpec(config);
		expect(canonical(after)).toEqual(canonical(before));
		for (const row of rows) {
			expect(after.paths['/' + row.route].post.responses['204']).toBeDefined();
			expect(after.paths['/' + row.route].post.responses['200']).toBeUndefined();
		}
	} finally { documentedEndpoints.splice(0, documentedEndpoints.length, ...saved); }
});

const nativeCases = [
	{ route: 'i/2fa/remove-key', schema: emptyObjectI2faRemoveKeyInput, valid: { password: 'correct', credentialId: 'cred-_=' } },
	{ route: 'i/2fa/update-key', schema: emptyObjectI2faUpdateKeyInput, valid: { name: 'Key', credentialId: 'cred-_=' } },
] as const;
for (const item of nativeCases) {
	describe(`${item.route}: real adapter validation and legacy first errors`, () => {
		for (const [name, make] of [
			['undefined', () => undefined], ['null', () => null], ['array', () => []], ['empty', () => ({})],
			['missing credentialId', () => item.route === 'i/2fa/remove-key' ? { password: 'correct' } : { name: 'Key' }],
			['wrong credentialId', () => ({ ...item.valid, credentialId: 1 })],
			['invalid known field', () => item.route === 'i/2fa/remove-key' ? { ...item.valid, token: 1 } : { ...item.valid, name: '' }],
		] as const) {
			test(name, async () => {
				const row = rows.find(row => row.route === item.route)!;
				const beforeCalled = vi.fn(async () => ({}));
				const before = new Endpoint<typeof row.meta, unknown, object>(row.meta, row.input, beforeCalled);
				const actual = item.route === 'i/2fa/remove-key' ? removeEndpoint() : updateEndpoint();
				const a = await Reflect.apply(before.exec, before, [make(), me, null]).catch(errorInfo);
				const b = await exec(actual.endpoint, make()).catch(errorInfo);
				expect(b).toEqual(a);
				expect(beforeCalled).not.toHaveBeenCalled();
				expect(actual.deps.keys.delete).not.toHaveBeenCalled();
				expect(actual.deps.keys.findOneBy).not.toHaveBeenCalled();
				expect(actual.deps.events.publishMainStream).not.toHaveBeenCalled();
			});
		}
		for (const [name, make] of [
			['own opaque poison keys', () => Object.assign(JSON.parse('{"__proto__":{"safe":true},"constructor":17,"prototype":null}'), item.valid, { future: { opaque: true } })],
			['inherited declared fields', () => Object.create(item.valid)],
			['own undefined token', () => ({ ...item.valid, token: undefined })],
		] as const) {
			test(name, async () => {
				const actual = item.route === 'i/2fa/remove-key' ? removeEndpoint() : updateEndpoint();
				const body = make(); const prototype = Object.getPrototypeOf(body); const ownKeys = Object.keys(body);
				const result = await exec(actual.endpoint, body);
				expect(result).toEqual({});
				expect(Object.getPrototypeOf(body)).toBe(prototype); expect(Object.keys(body)).toEqual(ownKeys);
				expect(actual.deps.events.publishMainStream).toHaveBeenCalledWith(me.id, 'meUpdated', actual.deps.packed);
				expect(actual.deps.users.pack).toHaveBeenCalledWith(me.id, me, { schema: 'MeDetailed', includeSecrets: true });
			});
		}
	});
}

test('generic native object callback receives the same original body and returns the same unparsed object', async () => {
	const body = Object.assign(Object.create({ password: 'correct' }), { credentialId: 'cred-_=', future: undefined });
	const opaqueResult = { undeclared: Number.NaN, opaque: { identity: true } };
	const callback = vi.fn(async (ps: v.InferOutput<typeof emptyObjectI2faRemoveKeyInput>) => { expect(ps).toBe(body); return opaqueResult; });
	const endpoint = new ContractEndpoint(removeMeta, projectEndpointContract(definitions['i/2fa/remove-key']), callback);
	const result = await Reflect.apply(endpoint.exec, endpoint, [body, me, null]);
	expect(result).toBe(opaqueResult); expect(callback).toHaveBeenCalledOnce();
});

for (const [name, enabled, token] of [['no TOTP required', false, null], ['valid TOTP', true, '123456']] as const) {
	test(`remove-key ${name} preserves operations and last-key update`, async () => {
		const { endpoint, deps } = removeEndpoint(dependencies(enabled));
		expect(await exec(endpoint, { password: 'correct', credentialId: 'cred-_=', token })).toEqual({});
		expect(deps.keys.delete).toHaveBeenCalledWith({ userId: me.id, id: 'cred-_=' });
		expect(deps.profiles.update).toHaveBeenCalledWith(me.id, { usePasswordLessLogin: false });
		expect(deps.auth.twoFactorAuthenticate).toHaveBeenCalledTimes(enabled ? 1 : 0);
		expect(deps.keys.delete.mock.invocationCallOrder[0]).toBeLessThan(deps.events.publishMainStream.mock.invocationCallOrder[0]);
	});
}

test('remove-key with remaining keys leaves passwordless flag unchanged', async () => {
	const { endpoint, deps } = removeEndpoint(dependencies(false, me.id, 1));
	await exec(endpoint, { password: 'correct', credentialId: 'cred-_=' });
	expect(deps.profiles.update).not.toHaveBeenCalled();
});

for (const token of [null, 'wrong']) {
	test(`remove-key rejects failed 2FA before deleting (${String(token)})`, async () => {
		const { endpoint, deps } = removeEndpoint(dependencies(true));
		await expect(exec(endpoint, { password: 'correct', credentialId: 'cred-_=', token })).rejects.toThrow('authentication failed');
		expect(deps.keys.delete).not.toHaveBeenCalled(); expect(deps.events.publishMainStream).not.toHaveBeenCalled();
	});
}

test('remove-key retains INCORRECT_PASSWORD error identity and suppresses side effects', async () => {
	const { endpoint, deps } = removeEndpoint();
	expect(await exec(endpoint, { password: 'wrong', credentialId: 'cred-_=' }).catch(errorInfo)).toEqual({ ...removeMeta.errors.incorrectPassword, info: undefined });
	expect(deps.keys.delete).not.toHaveBeenCalled(); expect(deps.events.publishMainStream).not.toHaveBeenCalled();
});

for (const [owner, expected] of [[null, updateMeta.errors.noSuchKey], ['Other1', updateMeta.errors.accessDenied]] as const) {
	test(`update-key retains ${expected.code}`, async () => {
		const { endpoint, deps } = updateEndpoint(dependencies(false, owner));
		expect(await exec(endpoint, { name: 'New', credentialId: 'cred-_=' }).catch(errorInfo)).toEqual({ ...expected, info: undefined });
		expect(deps.keys.update).not.toHaveBeenCalled(); expect(deps.events.publishMainStream).not.toHaveBeenCalled();
	});
}

test('update-key accepts 30 supplementary Unicode code points and updates only the owned key', async () => {
	const { endpoint, deps } = updateEndpoint();
	const name = '😀'.repeat(30);
	expect(v.safeParse(emptyObjectI2faUpdateKeyInput, { name, credentialId: 'cred-_=' }).success).toBe(true);
	expect(v.safeParse(emptyObjectI2faUpdateKeyInput, { name: '😀'.repeat(31), credentialId: 'cred-_=' }).success).toBe(false);
	await exec(endpoint, { name, credentialId: 'cred-_=' });
	expect(deps.keys.update).toHaveBeenCalledWith('cred-_=', { name });
});

test('real ApiCallService.send and Fastify preserve actual 200 {} separately from documented 204', async () => {
	const app = Fastify();
	const sender = Object.create(ApiCallService.prototype);
	for (const [path, factory, body] of [
		['/remove', removeEndpoint, { password: 'correct', credentialId: 'cred-_=' }],
		['/update', updateEndpoint, { name: 'Key', credentialId: 'cred-_=' }],
	] as const) {
		app.post(path, async (_request, reply) => {
			const result = await exec(factory().endpoint, body);
			Reflect.apply(Reflect.get(sender, 'send'), sender, [reply, result]);
		});
	}
	app.post('/void-control', async (_request, reply) => { Reflect.apply(Reflect.get(sender, 'send'), sender, [reply, undefined]); });
	try {
		for (const url of ['/remove', '/update']) {
			const response = await app.inject({ method: 'POST', url });
			expect(response.statusCode).toBe(200); expect(response.body).toBe('{}');
			expect(response.headers['content-type']).toContain('application/json');
		}
		const empty = await app.inject({ method: 'POST', url: '/void-control' });
		expect(empty.statusCode).toBe(204); expect(empty.body).toBe('');
	} finally { await app.close(); }
});

test('native output inference is object while no-res metadata stays independent', () => {
	expectTypeOf<v.InferOutput<typeof emptyObjectI2faRemoveKeyOutput>>().toMatchTypeOf<object>();
	expectTypeOf<v.InferOutput<typeof emptyObjectI2faUpdateKeyOutput>>().toMatchTypeOf<object>();
	expectTypeOf<object>().toMatchTypeOf<v.InferOutput<typeof emptyObjectI2faRemoveKeyOutput>>();
	expectTypeOf<object>().toMatchTypeOf<v.InferOutput<typeof emptyObjectI2faUpdateKeyOutput>>();
	for (const output of [emptyObjectI2faRemoveKeyOutput, emptyObjectI2faUpdateKeyOutput]) {
		expect(v.safeParse(output, {}).success).toBe(true); expect(v.safeParse(output, undefined).success).toBe(false);
	}
});
