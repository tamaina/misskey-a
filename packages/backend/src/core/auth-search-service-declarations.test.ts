/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import * as OTPAuth from 'otpauth';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DI } from '@/di-symbols.js';
import type { MiUser, MiUserProfile } from '@features/persistence/backend/repositories/models.js';
import { authSecurityServices, authServices } from '@features/auth/backend/services.js';
import { discoveryServices, userSearchServices } from '@features/discovery/backend/services.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import { UserSearchService } from '@features/discovery/backend/services/UserSearchService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { MiUserSecurityKey } from '@features/auth/backend/models/UserSecurityKey.js';
import { ports } from '@features/index/backend/service-ports.js';
import { featureServiceGroups } from '@features/index/backend/feature-service-providers.js';
import type { FactoryProvider, InjectionToken, Provider } from '@nestjs/common';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON, PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import type { SelectQueryBuilder } from 'typeorm';
import type { Inputs } from '@features/index/backend/service-definitions.js';

vi.mock('@simplewebauthn/server', () => ({
	generateAuthenticationOptions: vi.fn(), generateRegistrationOptions: vi.fn(),
	verifyAuthenticationResponse: vi.fn(), verifyRegistrationResponse: vi.fn(),
}));

const tokenOf = (provider: Provider): InjectionToken => typeof provider === 'function' ? provider : provider.provide;
const timestamp = Date.UTC(2026, 0, 2, 3, 4, 5);
const secret = 'JBSWY3DPEHPK3PXP';

function securityInputs() {
	const inputs = mockDeep<Inputs<typeof authSecurityServices>>({
		config: { url: 'https://example.test', hostname: 'example.test', host: 'example.test' },
		meta: { name: 'Example', iconUrl: null },
	});
	return inputs;
}

function authenticationResponse(): AuthenticationResponseJSON {
	return {
		id: 'credential-id', rawId: 'credential-id', type: 'public-key',
		response: { clientDataJSON: '', authenticatorData: '', signature: '' },
		clientExtensionResults: {},
	};
}

function storedKey() {
	return new MiUserSecurityKey({ id: 'credential-id', userId: 'user', publicKey: Buffer.from([1, 2, 3]).toString('base64url'), counter: 4, transports: ['internal'] });
}

function verifiedAuthentication(verified = true): Awaited<ReturnType<typeof verifyAuthenticationResponse>> {
	return { verified, authenticationInfo: { credentialID: 'credential-id', newCounter: 5, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://example.test', rpID: 'example.test' } };
}

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});

describe('auth and search declaration boundaries', () => {
	test('old auth and zero-input discovery definition/output shapes remain unchanged', () => {
		expect(Object.keys(authServices.definitions).sort()).toEqual(['AppEntityService', 'AuthSessionEntityService', 'InviteCodeEntityService', 'SigninEntityService']);
		expect(Object.keys(discoveryServices.definitions)).toEqual(['HashtagEntityService']);
		expect(Object.keys(discoveryServices.create())).toEqual(['HashtagEntityService']);
		expect(ports.redisClient.token).toBe(DI.redis);
		expect(authSecurityServices.ports.map(port => port.name).sort()).toEqual(['config', 'meta', 'redisClient', 'userProfilesRepository', 'userSecurityKeysRepository', 'usersRepository']);
	});

	test('plain security factories borrow one Redis object and direct constructors remain equivalent', () => {
		const inputs = securityInputs();
		const first = authSecurityServices.create(inputs);
		const second = authSecurityServices.create(inputs);
		const directAuth = new UserAuthService(inputs.redisClient, inputs.usersRepository, inputs.userProfilesRepository);
		const directWebAuthn = new WebAuthnService(inputs.config, inputs.meta, inputs.redisClient, inputs.userSecurityKeysRepository);
		for (const service of [first.UserAuthService, first.WebAuthnService, second.UserAuthService, second.WebAuthnService, directAuth, directWebAuthn]) expect(Reflect.get(service, 'redisClient')).toBe(inputs.redisClient);
		expect(first.UserAuthService).not.toBe(second.UserAuthService);
		expect(first.WebAuthnService).not.toBe(second.WebAuthnService);
		expect(first.WebAuthnService.getRelyingParty()).toEqual(directWebAuthn.getRelyingParty());
		expect(inputs.redisClient.disconnect).not.toHaveBeenCalled();
		expect(inputs.redisClient.quit).not.toHaveBeenCalled();
	});

	test('selective Nest composition preserves class/string aliases, strict lookup and DI.redis identity', async () => {
		const groups = [featureServiceGroups.authSecurity, featureServiceGroups.userSearch];
		const providers = groups.flatMap(group => group.providers);
		const factories = providers.filter((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
		const internal = new Set(providers.map(tokenOf));
		const external = new Set((factories.flatMap(provider => provider.inject ?? []) as InjectionToken[]).filter(token => !internal.has(token)));
		const inputs = securityInputs();
		const userEntity = mockDeep<UserEntityService>();
		const spies = factories.map(factory => vi.spyOn(factory, 'useFactory'));
		const module = await Test.createTestingModule({ providers: [
			...[...external].map(provide => ({ provide, useValue: provide === DI.redis ? inputs.redisClient : provide === UserEntityService ? userEntity : {} })),
			...providers,
		] }).compile();
		try {
			await module.init();
			const resolver = module.get(ModuleRef);
			for (const ctor of [UserAuthService, WebAuthnService, UserSearchService]) {
				const service = module.get<object>(ctor);
				expect(service).toBeInstanceOf(ctor);
				expect(module.get(ctor.name)).toBe(service);
				expect(resolver.get(ctor.name)).toBe(service);
				expect(Reflect.getMetadata('design:paramtypes', ctor)).toBeUndefined();
			}
			expect(Reflect.get(module.get(UserAuthService), 'redisClient')).toBe(module.get(DI.redis));
			expect(Reflect.get(module.get(WebAuthnService), 'redisClient')).toBe(module.get(DI.redis));
			expect(Reflect.get(module.get(UserSearchService), 'userEntityService')).toBe(userEntity);
			for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
		} finally { await module.close(); }
		expect(inputs.redisClient.disconnect).not.toHaveBeenCalled();
		expect(inputs.redisClient.quit).not.toHaveBeenCalled();
	});

	test('OTP normalization, fingerprinted replay key and ninety-second NX claim remain unchanged', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(timestamp);
		vi.stubEnv('NODE_ENV', 'test');
		vi.stubEnv('MISSKEY_TEST_CHECK_DUPLICATED_TOTP', '1');
		const inputs = securityInputs();
		inputs.redisClient.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);
		const service = authSecurityServices.create(inputs).UserAuthService;
		const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });
		const token = totp.generate({ timestamp });
		const key = `2fa:used:user:${createHash('sha256').update(secret).digest('base64url')}:${totp.counter({ timestamp })}`;
		expect(await service.validateOtp('user', secret, ` ${token} `)).toBe(true);
		expect(await service.validateOtp('user', secret, token)).toBe(false);
		expect(inputs.redisClient.set).toHaveBeenNthCalledWith(1, key, token, 'EX', 90, 'NX');
		expect(inputs.redisClient.set).toHaveBeenNthCalledWith(2, key, token, 'EX', 90, 'NX');
	});

	test('backup codes consume only the matching entry and replayed OTP rejects authentication', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(timestamp);
		vi.stubEnv('NODE_ENV', 'test');
		vi.stubEnv('MISSKEY_TEST_CHECK_DUPLICATED_TOTP', '1');
		const inputs = securityInputs();
		const service = authSecurityServices.create(inputs).UserAuthService;
		const authenticate = service.twoFactorAuthenticate;
		await authenticate(mockDeep<MiUserProfile>({ userId: 'user', twoFactorBackupSecret: ['used', 'keep'] }), 'used');
		expect(inputs.userProfilesRepository.update).toHaveBeenCalledWith({ userId: 'user' }, { twoFactorBackupSecret: ['keep'] });
		expect(inputs.redisClient.set).not.toHaveBeenCalled();
		inputs.redisClient.set.mockResolvedValue(null);
		const token = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 }).generate({ timestamp });
		await expect(authenticate(mockDeep<MiUserProfile>({ userId: 'user', twoFactorSecret: secret, twoFactorBackupSecret: [] }), token)).rejects.toThrow('authentication failed');
	});

	test('WebAuthn registration options preserve relying party, policy and ninety-second challenge TTL', async () => {
		const inputs = securityInputs();
		inputs.userSecurityKeysRepository.findBy.mockResolvedValue([storedKey()]);
		const options = mockDeep<PublicKeyCredentialCreationOptionsJSON>({ challenge: 'registration-challenge' });
		vi.mocked(generateRegistrationOptions).mockResolvedValue(options);
		const service = authSecurityServices.create(inputs).WebAuthnService;
		expect(await service.initiateRegistration('user', 'name', 'Display')).toBe(options);
		expect(generateRegistrationOptions).toHaveBeenCalledWith(expect.objectContaining({ rpName: 'Example', rpID: 'example.test', userName: 'name', userDisplayName: 'Display', excludeCredentials: [{ id: 'credential-id', transports: ['internal'] }], authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' } }));
		expect(inputs.redisClient.setex).toHaveBeenCalledWith('webauthn:registrationChallenge:user', 90, 'registration-challenge');
	});

	test('WebAuthn registration verification consumes the stored challenge and retains required user verification', async () => {
		const inputs = securityInputs();
		inputs.redisClient.get.mockResolvedValue('registration-challenge');
		vi.mocked(verifyRegistrationResponse).mockResolvedValue(mockDeep<Awaited<ReturnType<typeof verifyRegistrationResponse>>>({ verified: true, registrationInfo: { credential: { id: 'credential-id', publicKey: Uint8Array.from([1, 2]), counter: 1 }, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false, fmt: 'none', attestationObject: Uint8Array.from([3]) } }));
		const service = authSecurityServices.create(inputs).WebAuthnService;
		const response: RegistrationResponseJSON = { id: 'credential-id', rawId: 'credential-id', type: 'public-key', response: { clientDataJSON: '', attestationObject: '', transports: ['internal'] }, clientExtensionResults: {} };
		expect(await service.verifyRegistration('user', response)).toMatchObject({ credentialID: 'credential-id', counter: 1, userVerified: true, transports: ['internal'] });
		expect(inputs.redisClient.del).toHaveBeenCalledWith('webauthn:registrationChallenge:user');
		expect(verifyRegistrationResponse).toHaveBeenCalledWith({ response, expectedChallenge: 'registration-challenge', expectedOrigin: 'https://example.test', expectedRPID: 'example.test', requireUserVerification: true });
		expect(inputs.redisClient.del.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(verifyRegistrationResponse).mock.invocationCallOrder[0]);
	});

	test('WebAuthn authentication and passkey challenges retain TTL and scoped credential options', async () => {
		const inputs = securityInputs();
		inputs.userSecurityKeysRepository.findBy.mockResolvedValue([storedKey()]);
		const options = mockDeep<PublicKeyCredentialRequestOptionsJSON>({ challenge: 'authentication-challenge' });
		vi.mocked(generateAuthenticationOptions).mockResolvedValue(options);
		const service = authSecurityServices.create(inputs).WebAuthnService;
		await service.initiateAuthentication('user');
		expect(generateAuthenticationOptions).toHaveBeenNthCalledWith(1, { rpID: 'example.test', allowCredentials: [{ id: 'credential-id', transports: ['internal'] }], userVerification: 'preferred' });
		expect(inputs.redisClient.setex).toHaveBeenCalledWith('webauthn:authenticationChallenge:user', 90, 'authentication-challenge');
		await service.initiateSignInWithPasskeyAuthentication('context');
		expect(generateAuthenticationOptions).toHaveBeenNthCalledWith(2, { rpID: 'example.test', userVerification: 'preferred' });
		expect(inputs.redisClient.setex).toHaveBeenCalledWith('webauthn:passkeyChallenge:context', 90, 'authentication-challenge');
	});

	test('WebAuthn user authentication atomically consumes challenge and updates only the scoped credential', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(timestamp);
		const inputs = securityInputs();
		inputs.redisClient.getdel.mockResolvedValueOnce('authentication-challenge').mockResolvedValueOnce(null);
		inputs.userSecurityKeysRepository.findOneBy.mockResolvedValue(storedKey());
		vi.mocked(verifyAuthenticationResponse).mockResolvedValue(verifiedAuthentication());
		const service = authSecurityServices.create(inputs).WebAuthnService;
		const response = authenticationResponse();
		expect(await service.verifyAuthentication('user', response)).toBe(true);
		expect(inputs.redisClient.getdel).toHaveBeenCalledWith('webauthn:authenticationChallenge:user');
		expect(inputs.userSecurityKeysRepository.findOneBy).toHaveBeenCalledWith({ id: 'credential-id', userId: 'user' });
		expect(verifyAuthenticationResponse).toHaveBeenCalledWith({ response, expectedChallenge: 'authentication-challenge', expectedOrigin: 'https://example.test', expectedRPID: 'example.test', credential: { id: 'credential-id', publicKey: Buffer.from([1, 2, 3]), counter: 4, transports: ['internal'] }, requireUserVerification: true });
		expect(inputs.redisClient.getdel.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(verifyAuthenticationResponse).mock.invocationCallOrder[0]);
		expect(inputs.userSecurityKeysRepository.update).toHaveBeenCalledWith({ id: 'credential-id', userId: 'user' }, { lastUsed: new Date(timestamp), counter: 5, credentialDeviceType: 'singleDevice', credentialBackedUp: false });
		await expect(service.verifyAuthentication('user', response)).rejects.toThrow('challenge not found');
		expect(verifyAuthenticationResponse).toHaveBeenCalledTimes(1);
	});

	test('passkey verification consumes context challenge, returns owner and preserves negative-verification behavior', async () => {
		const inputs = securityInputs();
		inputs.redisClient.getdel.mockResolvedValue('passkey-challenge');
		inputs.userSecurityKeysRepository.findOneBy.mockResolvedValue(storedKey());
		vi.mocked(verifyAuthenticationResponse).mockResolvedValueOnce(verifiedAuthentication()).mockResolvedValueOnce(verifiedAuthentication(false));
		const service = authSecurityServices.create(inputs).WebAuthnService;
		expect(await service.verifySignInWithPasskeyAuthentication('context', authenticationResponse())).toBe('user');
		expect(inputs.redisClient.getdel).toHaveBeenCalledWith('webauthn:passkeyChallenge:context');
		expect(inputs.userSecurityKeysRepository.findOneBy).toHaveBeenCalledWith({ id: 'credential-id' });
		expect(await service.verifySignInWithPasskeyAuthentication('context', authenticationResponse())).toBeNull();
		expect(inputs.userSecurityKeysRepository.update).toHaveBeenCalledTimes(1);
	});

	test('malformed passkey protocol consumes its challenge without invoking verification or updating the credential', async () => {
		const inputs = securityInputs();
		inputs.redisClient.getdel.mockResolvedValue('passkey-challenge');
		inputs.userSecurityKeysRepository.findOneBy.mockResolvedValue(storedKey());
		const service = authSecurityServices.create(inputs).WebAuthnService;
		await expect(service.verifySignInWithPasskeyAuthentication('context', { id: 'credential-id' })).rejects.toMatchObject({ id: 'b18c89a7-5b5e-4cec-bb5b-0419f332d430' });
		expect(inputs.redisClient.getdel).toHaveBeenCalledWith('webauthn:passkeyChallenge:context');
		expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
		expect(inputs.userSecurityKeysRepository.update).not.toHaveBeenCalled();
	});

	test('search factory and direct constructor preserve ordered ID packing and borrowed serializer', async () => {
		const inputs = mockDeep<Inputs<typeof userSearchServices>>();
		const query = mockDeep<SelectQueryBuilder<MiUser>>();
		query.andWhere.mockReturnValue(query);
		query.select.mockReturnValue(query);
		query.limit.mockReturnValue(query);
		query.orderBy.mockReturnValue(query);
		query.getRawMany.mockResolvedValue([{ user_id: 'first' }, { user_id: 'second' }]);
		inputs.usersRepository.createQueryBuilder.mockReturnValue(query);
		inputs.userEntityService.packMany.mockResolvedValue([]);
		const factory = userSearchServices.create(inputs).UserSearchService;
		const direct = new UserSearchService(inputs.config, inputs.usersRepository, inputs.userProfilesRepository, inputs.followingsRepository, inputs.mutingsRepository, inputs.userEntityService);
		for (const service of [factory, direct]) {
			const search = service.searchByUsernameAndHost;
			expect(await search({ username: 'Name' }, { limit: 2, detail: false }, null)).toEqual([]);
			expect(Reflect.get(service, 'userEntityService')).toBe(inputs.userEntityService);
		}
		expect(inputs.userEntityService.packMany).toHaveBeenNthCalledWith(1, ['first', 'second'], null, { schema: 'UserLite' });
		expect(inputs.userEntityService.packMany).toHaveBeenNthCalledWith(2, ['first', 'second'], null, { schema: 'UserLite' });
		expect(query.andWhere).toHaveBeenCalledWith('user.usernameLower LIKE :username', { username: 'name%' });
	});
});
