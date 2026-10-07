/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { Ajv } from 'ajv';
import { inlineI2faKeyDoneInput, inlineI2faKeyDoneDefinition } from '@features/auth/contract/endpoint-definitions.js';
import { EndpointImplementation, meta, paramDef } from '@features/auth/backend/endpoints/i/2fa/key-done.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';

const mocks = vi.hoisted(() => ({ compare: vi.fn(), verify: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { compare: mocks.compare } }));
vi.mock('@simplewebauthn/server', () => ({ generateAuthenticationOptions: vi.fn(), generateRegistrationOptions: vi.fn(), verifyAuthenticationResponse: vi.fn(), verifyRegistrationResponse: mocks.verify }));
vi.mock('../../../../features/users/backend/serializers/UserEntityService.js', () => ({ UserEntityService: class {} }));
vi.mock('../../../../features/runtime/backend/services/GlobalEventService.js', () => ({ GlobalEventService: class {} }));
vi.mock('../../../../features/auth/backend/services/UserAuthService.js', () => ({ UserAuthService: class {} }));

const originalInput = {
	type: 'object', properties: {
		password: { type: 'string' }, token: { type: 'string', nullable: true },
		name: { type: 'string', minLength: 1, maxLength: 30 }, credential: { type: 'object' },
	}, required: ['password', 'name', 'credential'],
} as const;
const originalOutput = { type: 'object', nullable: false, optional: false, properties: { id: { type: 'string' }, name: { type: 'string' } } } as const;
const body = () => ({ password: 'synthetic-test-password', token: 'synthetic-test-token', name: 'Key', credential: { invalidButObject: true } });
beforeEach(() => { vi.clearAllMocks(); mocks.compare.mockResolvedValue(true); });

test('native object-only credential is honest and does not claim WebAuthn domain validation', () => {
	const input = body(); const parsed = v.parse(inlineI2faKeyDoneInput, input);
	expect(parsed.credential).toBe(input.credential);
	for (const credential of [{}, { response: null }, { id: 42 }]) expect(v.safeParse(inlineI2faKeyDoneInput, { ...input, credential }).success).toBe(true);
	for (const credential of [null, [], 'x', 42]) expect(v.safeParse(inlineI2faKeyDoneInput, { ...input, credential }).success).toBe(false);
	for (const name of ['x', '😀'.repeat(30)]) expect(v.safeParse(inlineI2faKeyDoneInput, { ...input, name }).success).toBe(true);
	for (const name of ['', '😀'.repeat(31)]) expect(v.safeParse(inlineI2faKeyDoneInput, { ...input, name }).success).toBe(false);
	for (const token of [null, undefined, '']) expect(v.safeParse(inlineI2faKeyDoneInput, { ...input, token }).success).toBe(true);
});

test('frozen input and written response docs retain legacy shape and branch flags', () => {
	expect(paramDef).toEqual(originalInput);
	expect(meta.requireCredential).toBe(true); expect(meta.secure).toBe(true);
	expect(meta.res.nullable).toBe(false); expect(meta.res.optional).toBe(false);
	expect(convertSchemaToOpenApiSchema(meta.res, 'res', true)).toEqual(convertSchemaToOpenApiSchema(originalOutput, 'res', true));
	expect(projectEndpointContract(inlineI2faKeyDoneDefinition).response).toEqual({ type: 'object', properties: { id: { type: 'string', optional: false }, name: { type: 'string', optional: false } }, required: ['id', 'name'] });
});

test('original/projected AJV errors and mutations match for malformed and Unicode inputs', () => {
	const ajv = new Ajv({ useDefaults: true }), before = ajv.compile(originalInput), after = ajv.compile(paramDef);
	for (const input of [body(), {}, ...[null, [], 1, {}, undefined].map(credential => ({ ...body(), credential })), ...['', '😀'.repeat(30), '😀'.repeat(31)].map(name => ({ ...body(), name }))]) {
		const a = structuredClone(input), b = structuredClone(input);
		expect(after(b)).toBe(before(a)); expect(after.errors).toEqual(before.errors); expect(b).toEqual(a);
	}
});

function harness(options: { twoFactorEnabled?: boolean; authenticationFails?: boolean; verificationFails?: boolean; passwordMatches?: boolean } = {}) {
	const calls: unknown[][] = [], me = { id: 'test-user' }, profile = { twoFactorEnabled: options.twoFactorEnabled ?? true, password: 'synthetic-test-hash' }, packed = { preserved: true };
	const info = { credentialID: 'credential-id', credentialPublicKey: new Uint8Array([1, 2, 3]), counter: 7, credentialDeviceType: 'singleDevice', credentialBackedUp: false, transports: ['usb'] };
	mocks.compare.mockImplementation(async (...args: unknown[]) => { calls.push(['password', ...args]); return options.passwordMatches ?? true; });
	const endpoint: Pick<EndpointImplementation, 'exec'> = Reflect.construct(EndpointImplementation, [
		{ findOneByOrFail: async (...args: unknown[]) => { calls.push(['profile', ...args]); return profile; } },
		{ insert: async (...args: unknown[]) => { calls.push(['insert', ...args]); } },
		{ verifyRegistration: async (...args: unknown[]) => { calls.push(['verify', ...args]); if (options.verificationFails) throw new Error('library rejected'); return info; } },
		{ twoFactorAuthenticate: async (...args: unknown[]) => { calls.push(['2fa', ...args]); if (options.authenticationFails) throw new Error('auth rejected'); } },
		{ pack: async (...args: unknown[]) => { calls.push(['pack', ...args]); return packed; } },
		{ publishMainStream: (...args: unknown[]) => calls.push(['event', ...args]) },
	]);
	return { endpoint, calls, me, profile, packed, info };
}

test('actual key-done adapter preserves unchecked credential identity and every successful effect', async () => {
	const h = harness(), input = body();
	expect(await h.endpoint.exec(input, h.me as never, null, undefined, '192.0.2.1')).toEqual({ id: 'credential-id', name: 'Key' });
	expect(h.calls).toEqual([
		['profile', { userId: h.me.id }], ['2fa', h.profile, input.token], ['password', input.password, h.profile.password],
		['verify', h.me.id, input.credential],
		['insert', { id: 'credential-id', userId: h.me.id, name: 'Key', publicKey: 'AQID', counter: 7, credentialDeviceType: 'singleDevice', credentialBackedUp: false, transports: ['usb'] }],
		['pack', h.me.id, h.me, { schema: 'MeDetailed', includeSecrets: true }], ['event', h.me.id, 'meUpdated', h.packed],
	]);
	expect(h.calls[3][2]).toBe(input.credential);
});

test('HTTP rejects nonobject credentials before profile/auth/password/library effects', async () => {
	for (const credential of [null, [], 42]) {
		const h = harness();
		await expect(h.endpoint.exec({ ...body(), credential }, h.me as never, null, undefined, '192.0.2.1')).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		expect(h.calls).toEqual([]);
	}
});

test('existing authentication and verification errors suppress later effects in the same order', async () => {
	let h = harness();
	await expect(h.endpoint.exec({ ...body(), token: null }, h.me as never, null, undefined, '192.0.2.1')).rejects.toThrow('authentication failed');
	expect(h.calls.map(c => c[0])).toEqual(['profile']);
	h = harness({ authenticationFails: true });
	await expect(h.endpoint.exec(body(), h.me as never, null, undefined, '192.0.2.1')).rejects.toThrow('authentication failed');
	expect(h.calls.map(c => c[0])).toEqual(['profile', '2fa']);
	h = harness({ twoFactorEnabled: false });
	await expect(h.endpoint.exec(body(), h.me as never, null, undefined, '192.0.2.1')).rejects.toMatchObject({ code: 'TWO_FACTOR_NOT_ENABLED' });
	expect(h.calls.map(c => c[0])).toEqual(['profile', 'password']);
	h = harness({ passwordMatches: false });
	await expect(h.endpoint.exec(body(), h.me as never, null, undefined, '192.0.2.1')).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD', id: '0d7ec6d2-e652-443e-a7bf-9ee9a0cd77b0' });
	expect(h.calls.map(c => c[0])).toEqual(['profile', '2fa', 'password']);
	h = harness({ verificationFails: true });
	await expect(h.endpoint.exec(body(), h.me as never, null, undefined, '192.0.2.1')).rejects.toThrow('library rejected');
	expect(h.calls.map(c => c[0])).toEqual(['profile', '2fa', 'password', 'verify']);
});

test('actual WebAuthn service deletes challenge before library rejection of an unchecked object', async () => {
	const calls: unknown[][] = [], response = { invalidButObject: true };
	const service: WebAuthnService = Reflect.construct(WebAuthnService, [{ url: 'https://example.test', hostname: 'example.test' }, { name: 'test' }, {
		get: async (...args: unknown[]) => { calls.push(['get', ...args]); return 'synthetic-challenge'; },
		del: async (...args: unknown[]) => { calls.push(['delete', ...args]); },
	}, {}]);
	mocks.verify.mockImplementation(async (arg: unknown) => { calls.push(['library', arg]); throw new Error('bad credential'); });
	const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		await expect(Reflect.apply(service.verifyRegistration, service, ['test-user', response])).rejects.toMatchObject({ id: '5c1446f8-8ca7-4d31-9f39-656afe9c5d87' });
		expect(calls.map(c => c[0])).toEqual(['get', 'delete', 'library']);
		expect(Reflect.get(calls[2][1] as object, 'response')).toBe(response);
	} finally { errorLog.mockRestore(); }
});

test('missing challenge fails before deletion and library verification', async () => {
	const calls: unknown[][] = [];
	const service: WebAuthnService = Reflect.construct(WebAuthnService, [{}, {}, {
		get: async (...args: unknown[]) => { calls.push(['get', ...args]); return null; },
		del: async (...args: unknown[]) => { calls.push(['delete', ...args]); },
	}, {}]);
	await expect(Reflect.apply(service.verifyRegistration, service, ['test-user', {}])).rejects.toMatchObject({ id: '7dbfb66c-9216-4e2b-9c27-cef2ac8efb84' });
	expect(calls).toEqual([['get', 'webauthn:registrationChallenge:test-user']]); expect(mocks.verify).not.toHaveBeenCalled();
});
