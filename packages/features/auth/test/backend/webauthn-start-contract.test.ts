/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import bcrypt from 'bcryptjs';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { mockDeep } from 'vitest-mock-extended';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { EndpointImplementation } from '../../backend/endpoints/i/2fa/register-key.js';
import { inlineI2faRegisterKeyOutput, inlineI2faRegisterKeyDefinition } from '../../contract/endpoint-definitions.js';
import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
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
	expect(v.parse(inlineI2faRegisterKeyOutput, JSON.parse(JSON.stringify(result)))).toEqual(result);
	expect(result).toMatchObject({ rp: { name: 'Fixture', id: 'example.com' }, user: { id: 'dXNlcjEyMw', name: 'fixture', displayName: '' }, timeout: 60000, attestation: 'none', authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' }, extensions: { credProps: true }, hints: [] });
	expect(result.excludeCredentials).toEqual(withKey ? [{ id: 'AQID', type: 'public-key', transports: ['usb'] }] : []);
	expect(h.keys.findBy).toHaveBeenCalledWith({ userId: 'user123' });
	expect(h.redis.setex).toHaveBeenCalledWith('webauthn:registrationChallenge:user123', 90, result.challenge);
	for (const bad of [{ ...result, future: true }, { ...result, challenge: 7 }, { ...result, rp: { ...result.rp, future: true } }, { ...result, extensions: { credProps: true, future: true } }, { ...result, pubKeyCredParams: [{ type: 'invalid', alg: -7 }] }]) expect(v.safeParse(inlineI2faRegisterKeyOutput, bad).success).toBe(false);
	const { challenge: _challenge, ...missing } = result;
	expect(v.safeParse(inlineI2faRegisterKeyOutput, missing).success).toBe(false);
});

test('real start endpoint retains password/2FA guards and forwards unparsed producer identity', async () => {
	const profiles = mockDeep<ConstructorParameters<typeof EndpointImplementation>[0]>();
	const producer = mockDeep<WebAuthnService>();
	const auth = mockDeep<ConstructorParameters<typeof EndpointImplementation>[2]>();
	const me = mockDeep<MiLocalUser>({ id: 'user123' });
	const profile = mockDeep<NonNullable<Awaited<ReturnType<ConstructorParameters<typeof EndpointImplementation>[0]['findOne']>>>>({ userId: me.id, password: bcrypt.hashSync('password', 4), twoFactorEnabled: true, user: null });
	profiles.findOne.mockResolvedValue(profile);
	const endpoint = new EndpointImplementation(profiles, producer, auth);
	await expect(endpoint.exec({ password: 'wrong', token: null }, me, null)).rejects.toThrow('authentication failed');
	expect(producer.initiateRegistration).not.toHaveBeenCalled();
	await expect(endpoint.exec({ password: 'wrong', token: 'totp' }, me, null)).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' });
	expect(auth.twoFactorAuthenticate).toHaveBeenCalledWith(profile, 'totp');
	const raw = { ...await service(false).producer.initiateRegistration(me.id, 'fixture'), future: true };
	producer.initiateRegistration.mockResolvedValue(raw);
	expect(await endpoint.exec({ password: 'password', token: 'totp', future: true }, me, null)).toBe(raw);
	expect(producer.initiateRegistration).toHaveBeenCalledWith(me.id, me.id, undefined);
	expect(v.safeParse(inlineI2faRegisterKeyOutput, raw).success).toBe(false);
	profiles.findOne.mockResolvedValue(null);
	await expect(endpoint.exec({ password: 'wrong' }, me, null)).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
	await expect(endpoint.exec({}, me, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(projectEndpointContract(inlineI2faRegisterKeyDefinition).response).toHaveProperty('additionalProperties', false);
});

// The dependency emits transports: undefined for existing keys without transports.
test('native optional undefined is forwarded while JSON wire omits it', async () => {
	const result = await service(true, false).producer.initiateRegistration('user123', 'fixture');
	expect(result.excludeCredentials?.[0]).toHaveProperty('transports', undefined);
	expect(v.safeParse(inlineI2faRegisterKeyOutput, result).success).toBe(false);
	const wire: unknown = JSON.parse(JSON.stringify(result));
	expect(v.parse(inlineI2faRegisterKeyOutput, wire)).toEqual(wire);
});
