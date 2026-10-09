/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import { testContext } from './native-context.js';
import { expect, test } from 'vitest';
import * as v from 'valibot';
import bcrypt from 'bcryptjs';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { mockDeep } from 'vitest-mock-extended';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { createI2faRegisterKeyProcedure } from '../../backend/endpoints/i/2fa/register-key.js';
import { I2faRegisterKeyContract } from '../../backend/api.definition.js';
import { toWebAuthnRegistrationOptions } from '../../backend/webauthn.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

function service(withKey: boolean, withTransports = true) {
	const keys = mockDeep<ConstructorParameters<typeof WebAuthnService>[3]>();
	const key = new MiUserSecurityKey({});
	key.id = 'AQID';
	key.transports = withTransports ? ['usb'] : null;
	keys.findBy.mockResolvedValue(withKey ? [key] : []);
	const redis = mockDeep<ConstructorParameters<typeof WebAuthnService>[2]>();
	const producer = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ url: 'https://example.com', hostname: 'example.com', host: 'example.com' }), mockDeep<ConstructorParameters<typeof WebAuthnService>[1]>({ name: 'Fixture' }), redis, keys);
	return { producer, redis, keys };
}

test.each([false, true])('real registration producer keeps challenge storage and finite default options: key=%s', async withKey => {
	const h = service(withKey);
	const result = await h.producer.initiateRegistration('user123', 'fixture');
	expect(v.parse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), JSON.parse(JSON.stringify(result)))).toEqual(result);
	expect(result).toMatchObject({ rp: { name: 'Fixture', id: 'example.com' }, user: { id: 'dXNlcjEyMw', name: 'fixture', displayName: '' }, timeout: 60000, attestation: 'none', authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' }, extensions: { credProps: true }, hints: [] });
	expect(result.excludeCredentials).toEqual(withKey ? [{ id: 'AQID', type: 'public-key', transports: ['usb'] }] : []);
	expect(h.keys.findBy).toHaveBeenCalledWith({ userId: 'user123' });
	expect(h.redis.setex).toHaveBeenCalledWith('webauthn:registrationChallenge:user123', 90, result.challenge);
	for (const bad of [{ ...result, future: true }, { ...result, challenge: 7 }, { ...result, rp: { ...result.rp, future: true } }, { ...result, extensions: { credProps: true, future: true } }, { ...result, pubKeyCredParams: [{ type: 'invalid', alg: -7 }] }]) expect(v.safeParse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), bad).success).toBe(false);
	const { challenge: _challenge, ...missing } = result;
	expect(v.safeParse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), missing).success).toBe(false);
});
test('real start endpoint retains password/2FA guards and validates producer output', async () => {
	const profiles = mockDeep<Parameters<typeof createI2faRegisterKeyProcedure>[0]['userProfilesRepository']>();
	const producer = mockDeep<WebAuthnService>();
	const auth = mockDeep<Parameters<typeof createI2faRegisterKeyProcedure>[0]['userAuthService']>();
	const me = mockDeep<MiLocalUser>({ id: 'user123', isSuspended: false, movedToUri: null });
	const profile = mockDeep<NonNullable<Awaited<ReturnType<Parameters<typeof createI2faRegisterKeyProcedure>[0]['userProfilesRepository']['findOne']>>>>({ userId: me.id, password: bcrypt.hashSync('password', 4), twoFactorEnabled: true, user: null });
	profiles.findOne.mockResolvedValue(profile);
	const endpoint = createI2faRegisterKeyProcedure({ userProfilesRepository: profiles, webAuthnService: producer, userAuthService: auth });
	await expect(call(endpoint, { password: 'wrong', token: null }, { context: testContext(me, null) })).rejects.toThrow('authentication failed');
	expect(producer.initiateRegistration).not.toHaveBeenCalled();
	await expect(call(endpoint, { password: 'wrong', token: 'totp' }, { context: testContext(me, null) })).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' });
	expect(auth.twoFactorAuthenticate).toHaveBeenCalledWith(profile, 'totp');
	const raw = await service(false).producer.initiateRegistration(me.id, 'fixture');
	producer.initiateRegistration.mockResolvedValue(raw);
	expect(await call(endpoint, v.parse(requiredSchema(I2faRegisterKeyContract['~orpc'].inputSchema), { password: 'password', token: 'totp', future: true }), { context: testContext(me, null) })).toEqual(toWebAuthnRegistrationOptions(raw));
	expect(producer.initiateRegistration).toHaveBeenCalledWith(me.id, me.id, undefined);
	const invalid = { ...raw, future: true };
	producer.initiateRegistration.mockResolvedValue(invalid);
	expect(v.safeParse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), invalid).success).toBe(false);
	await expect(call(endpoint, { password: 'password', token: 'totp' }, { context: testContext(me, null) })).rejects.toBeInstanceOf(v.ValiError);
	profiles.findOne.mockResolvedValue(null);
	await expect(call(endpoint, { password: 'wrong' }, { context: testContext(me, null) })).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
	expect(v.safeParse(requiredSchema(I2faRegisterKeyContract['~orpc'].inputSchema), {}).success).toBe(false);
});

// The dependency emits transports: undefined for existing keys without transports.
test('native optional undefined is forwarded while JSON wire omits it', async () => {
	const result = await service(true, false).producer.initiateRegistration('user123', 'fixture');
	expect(result.excludeCredentials?.[0]).toHaveProperty('transports', undefined);
	expect(v.safeParse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), result).success).toBe(false);
	const wire = toWebAuthnRegistrationOptions(result);
	expect(v.parse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), wire)).toEqual(wire);
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
