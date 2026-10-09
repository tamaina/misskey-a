/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { call } from '@orpc/server';
import * as v from 'valibot';
import bcrypt from 'bcryptjs';
import { createAuthRouter, type AuthContext, type AuthOperations } from '../../backend/api.router.js';
import { authContract } from '../../backend/api.contract.js';
import { selectorIRevokeTokenInput, emptyAdminCaptchaCurrentInput, inlineI2faKeyDoneInput } from '../../backend/auth.schema.js';
import { IRevokeTokenOperation, type TokenRevocationRepository } from '../../backend/endpoints/i/revoke-token.js';
import { I2faKeyDoneOperation } from '../../backend/endpoints/i/2fa/key-done.js';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import type { ApiActor, ApiServices } from '../../../api/backend/transport/context.js';
import type { MiAccessToken } from '../../backend/models/AccessToken.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';

const actor: ApiActor = { id: 'user123', isSuspended: false, movedToUri: null };

function harness() {
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, null]);
	services.limitActor.mockReturnValue(actor.id);
	services.rateLimitFactor.mockResolvedValue(1);
	services.limit.mockResolvedValue(null);
	const operations = mockDeep<AuthOperations<ApiActor>>();
	const context: AuthContext<ApiActor> = { services, operations: { auth: operations }, credential: null, ip: '127.0.0.1', headers: {} };
	return { services, operations, context, router: createAuthRouter<ApiActor>() };
}

test('all 39 native auth routes retain policy-before-input validation', async () => {
	expect(Object.keys(authContract)).toHaveLength(39);
	const h = harness();
	h.services.authenticate.mockResolvedValue([actor, { permission: ['write:account'] }]);
	await expect(call(h.router['i/change-password'], { currentPassword: 'old', newPassword: 'new' }, { context: h.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED', data: { id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e' } });
	expect(h.operations['i/change-password']).not.toHaveBeenCalled();
	h.services.authenticate.mockResolvedValue([null, null]);
	await expect(call(h.router['i/2fa/key-done'], { password: 'password', name: '', credential: null }, { context: h.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	for (const value of [undefined, null, 5, true, ['ignored'], { ignored: { future: true } }]) expect(v.safeParse(emptyAdminCaptchaCurrentInput, value).success).toBe(true);
});

test('token revocation preserves manual credentials, own-token restriction and competing selector precedence', async () => {
	const repository = mockDeep<TokenRevocationRepository>();
	const operation = new IRevokeTokenOperation(repository);
	const me = mockDeep<MiLocalUser>({ id: actor.id });
	await expect(operation.execute({ token: null }, null, null)).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED', data: { id: '6f1f0d3a-3d5b-4b1f-9c3e-2a6d1e5b8c47' } });
	repository.findOneBy.mockResolvedValue(null);
	const competing = v.parse(selectorIRevokeTokenInput, { token: 'secret', tokenId: { legacy: true } });
	await operation.execute(competing, me, null);
	expect(repository.findOneBy).toHaveBeenCalledWith({ id: { legacy: true }, userId: me.id });
	repository.findOneBy.mockResolvedValue(mockDeep<MiAccessToken>({ id: 'target123' }));
	await expect(operation.execute({ token: 'secret' }, me, { id: 'current123', permission: [] })).rejects.toMatchObject({ code: 'PERMISSION_DENIED', data: { id: 'fc20d118-5705-4462-b6c5-2b5b43092cf3' } });
	expect(repository.delete).not.toHaveBeenCalled();
	await operation.execute({ token: 'secret' }, me, { id: 'target123', permission: [] });
	expect(repository.delete).toHaveBeenCalledWith({ id: 'target123' });
});

test('malformed registration credentials retain password and stored challenge ordering', async () => {
	const profiles = mockDeep<ConstructorParameters<typeof I2faKeyDoneOperation>[0]>();
	const auth = mockDeep<ConstructorParameters<typeof I2faKeyDoneOperation>[3]>();
	const redis = mockDeep<ConstructorParameters<typeof WebAuthnService>[2]>();
	const domain = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ url: 'https://example.com', hostname: 'example.com', host: 'example.com' }), mockDeep<ConstructorParameters<typeof WebAuthnService>[1]>({ name: 'Fixture' }), redis, mockDeep());
	const operation = new I2faKeyDoneOperation(profiles, mockDeep(), domain, auth, mockDeep(), mockDeep());
	const me = mockDeep<MiLocalUser>({ id: actor.id });
	profiles.findOneByOrFail.mockResolvedValue(mockDeep<NonNullable<Awaited<ReturnType<ConstructorParameters<typeof I2faKeyDoneOperation>[0]['findOneByOrFail']>>>>({ userId: me.id, password: bcrypt.hashSync('password', 4), twoFactorEnabled: true }));
	const input = v.parse(inlineI2faKeyDoneInput, { password: 'wrong', token: 'totp', name: 'Key', credential: {} });
	await expect(operation.execute(input, me)).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' });
	expect(redis.get).not.toHaveBeenCalled();
	redis.get.mockResolvedValue(null);
	await expect(operation.execute({ ...input, password: 'password' }, me)).rejects.toMatchObject({ id: '7dbfb66c-9216-4e2b-9c27-cef2ac8efb84' });
	expect(redis.del).not.toHaveBeenCalled();
	redis.get.mockResolvedValue('challenge');
	vi.spyOn(console, 'error').mockImplementation(() => {});
	await expect(operation.execute({ ...input, password: 'password' }, me)).rejects.toMatchObject({ id: '5c1446f8-8ca7-4d31-9f39-656afe9c5d87' });
	expect(redis.del).toHaveBeenCalledWith(`webauthn:registrationChallenge:${me.id}`);
});
