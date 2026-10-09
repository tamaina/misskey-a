/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import { testContext } from './native-context.js';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import Fastify from 'fastify';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import * as v from 'valibot';
import bcrypt from 'bcryptjs';
import { createAuthRouter, type AuthRouterDependencies } from '../../backend/api.router.js';
import { authContract, AdminCaptchaCurrentContract, I2faKeyDoneContract, IRevokeTokenContract } from '../../backend/api.contract.js';
import { createIRevokeTokenProcedure, type TokenRevocationRepository } from '../../backend/endpoints/i/revoke-token.js';
import { createI2faKeyDoneProcedure } from '../../backend/endpoints/i/2fa/key-done.js';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import type { ApiContext, ApiServices } from '../../../api/backend/transport/context.js';
import type { MiAccessToken } from '../../backend/models/AccessToken.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
const actor = mockDeep<MiLocalUser>({ id: 'user123', isSuspended: false, movedToUri: null });

function harness() {
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([actor, null]);
	services.limitActor.mockReturnValue(actor.id);
	services.rateLimitFactor.mockResolvedValue(1);
	services.limit.mockResolvedValue(null);
	const operations = mockDeep<AuthRouterDependencies>();
	const context: ApiContext<MiLocalUser> = { services, credential: null, ip: '127.0.0.1', headers: {} };
	return { services, operations, context, router: createAuthRouter(operations) };
}

test('all 39 native auth routes retain secure policy enforcement', async () => {
	expect(Object.keys(authContract)).toHaveLength(39);
	const h = harness();
	h.services.authenticate.mockResolvedValue([actor, { permission: ['write:account'] }]);
	await expect(call(h.router['i/change-password'], { currentPassword: 'old', newPassword: 'new' }, { context: h.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED', data: { id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e' } });
	expect(h.operations['i/change-password'].userProfilesRepository.findOneByOrFail).not.toHaveBeenCalled();
	h.services.authenticate.mockResolvedValue([null, null]);
	await expect(call(h.router['i/2fa/key-done'], { password: 'password', name: '', credential: null }, { context: h.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	for (const value of [undefined, null, 5, true, ['ignored'], { ignored: { future: true } }]) expect(v.safeParse(requiredSchema(AdminCaptchaCurrentContract['~orpc'].inputSchema), value).success).toBe(true);
});

test('malformed HTTP inputs fail authentication and secure-token policy before input validation', async () => {
	const h = harness();
	const handler = new OpenAPIHandler(h.router, { customErrorResponseBodyEncoder: misskeyErrorBody });
	const app = Fastify();
	await app.register(async api => registerPilotHttp(api, handler, {
		maxFileSize: 1024, context: () => h.context, runSpan: (_name, run) => run(),
	}), { prefix: '/api' });
	try {
		h.services.authenticate.mockResolvedValue([actor, { permission: ['write:account'] }]);
		const secure = await app.inject({ method: 'POST', url: '/api/i/change-password', payload: { currentPassword: 42, newPassword: null } });
		expect(secure.statusCode).toBe(400);
		expect(secure.json()).toMatchObject({ error: { code: 'ACCESS_DENIED', id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e' } });
		h.services.authenticate.mockResolvedValue([null, null]);
		const anonymous = await app.inject({ method: 'POST', url: '/api/i/2fa/key-done', payload: { password: 42, name: false, credential: [] } });
		expect(anonymous.statusCode).toBe(400);
		expect(anonymous.json()).toMatchObject({ error: { code: 'ACCESS_DENIED' } });
		h.services.authenticate.mockResolvedValue([actor, null]);
		const authenticated = await app.inject({ method: 'POST', url: '/api/i/change-password', payload: { currentPassword: 42, newPassword: null } });
		expect(authenticated.statusCode).toBe(400);
		expect(authenticated.json()).toMatchObject({ error: { code: 'INVALID_PARAM' } });
		expect(h.services.authenticate).toHaveBeenCalledTimes(3);
		expect(h.operations['i/change-password'].userProfilesRepository.findOneByOrFail).not.toHaveBeenCalled();
		expect(h.operations['i/2fa/key-done'].userProfilesRepository.findOneByOrFail).not.toHaveBeenCalled();
	} finally { await app.close(); }
});

test('token revocation preserves manual credentials, own-token restriction and competing selector precedence', async () => {
	const repository = mockDeep<TokenRevocationRepository>();
	const operation = createIRevokeTokenProcedure({ accessTokensRepository: repository });
	const me = mockDeep<MiLocalUser>({ id: actor.id, isSuspended: false, movedToUri: null });
	await expect(call(operation, { token: null }, { context: testContext(null, null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED', data: { id: '6f1f0d3a-3d5b-4b1f-9c3e-2a6d1e5b8c47' } });
	repository.findOneBy.mockResolvedValue(null);
	const competing = v.parse(requiredSchema(IRevokeTokenContract['~orpc'].inputSchema), { token: 'secret', tokenId: { legacy: true } });
	await call(operation, competing, { context: testContext(me, null) });
	expect(repository.findOneBy).toHaveBeenCalledWith({ id: { legacy: true }, userId: me.id });
	repository.findOneBy.mockResolvedValue(mockDeep<MiAccessToken>({ id: 'target123' }));
	await expect(call(operation, { token: 'secret' }, { context: testContext(me, { id: 'current123', permission: [] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED', data: { id: 'fc20d118-5705-4462-b6c5-2b5b43092cf3' } });
	expect(repository.delete).not.toHaveBeenCalled();
	await call(operation, { token: 'secret' }, { context: testContext(me, { id: 'target123', permission: [] }) });
	expect(repository.delete).toHaveBeenCalledWith({ id: 'target123' });
});

test('malformed registration credentials retain password and stored challenge ordering', async () => {
	const profiles = mockDeep<Parameters<typeof createI2faKeyDoneProcedure>[0]['userProfilesRepository']>();
	const auth = mockDeep<Parameters<typeof createI2faKeyDoneProcedure>[0]['userAuthService']>();
	const redis = mockDeep<ConstructorParameters<typeof WebAuthnService>[2]>();
	const domain = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ url: 'https://example.com', hostname: 'example.com', host: 'example.com' }), mockDeep<ConstructorParameters<typeof WebAuthnService>[1]>({ name: 'Fixture' }), redis, mockDeep());
	const operation = createI2faKeyDoneProcedure({ userProfilesRepository: profiles, userSecurityKeysRepository: mockDeep(), webAuthnService: domain, userAuthService: auth, userEntityService: mockDeep(), globalEventService: mockDeep() });
	const me = mockDeep<MiLocalUser>({ id: actor.id, isSuspended: false, movedToUri: null });
	profiles.findOneByOrFail.mockResolvedValue(mockDeep<NonNullable<Awaited<ReturnType<Parameters<typeof createI2faKeyDoneProcedure>[0]['userProfilesRepository']['findOneByOrFail']>>>>({ userId: me.id, password: bcrypt.hashSync('password', 4), twoFactorEnabled: true }));
	const input = v.parse(requiredSchema(I2faKeyDoneContract['~orpc'].inputSchema), { password: 'wrong', token: 'totp', name: 'Key', credential: {} });
	await expect(call(operation, input, { context: testContext(me, null) })).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' });
	expect(redis.get).not.toHaveBeenCalled();
	redis.get.mockResolvedValue(null);
	await expect(call(operation, { ...input, password: 'password' }, { context: testContext(me, null) })).rejects.toMatchObject({ id: '7dbfb66c-9216-4e2b-9c27-cef2ac8efb84' });
	expect(redis.del).not.toHaveBeenCalled();
	redis.get.mockResolvedValue('challenge');
	vi.spyOn(console, 'error').mockImplementation(() => { });
	await expect(call(operation, { ...input, password: 'password' }, { context: testContext(me, null) })).rejects.toMatchObject({ id: '5c1446f8-8ca7-4d31-9f39-656afe9c5d87' });
	expect(redis.del).toHaveBeenCalledWith(`webauthn:registrationChallenge:${me.id}`);
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
