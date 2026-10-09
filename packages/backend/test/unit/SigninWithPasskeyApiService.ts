/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile, UserProfilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalModule } from '@features/boot/backend/assembly/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { CoreModule } from '@features/boot/backend/assembly/CoreModule.js';
import { createSigninWithPasskeyProcedure, type SigninWithPasskeyDependencies } from '@features/auth/backend/endpoints/signinWithPasskey.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { call } from '@orpc/server';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import { SigninService } from '@features/auth/backend/transport/SigninService.js';
import type { AuthSessionBody, AuthSessionRequest, AuthSessionEffects } from '@features/auth/backend/session.effects.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';

class FakeLimiter {
	public async limit() {
		return;
	}
}

class FakeSigninService {
	public signin(...args: Parameters<SigninService['signin']>): ReturnType<SigninService['signin']> {
		return { finished: true, id: args[2].id, i: 'fixture-session-token' };
	}
}

class DummyReply implements AuthSessionEffects {
	public statusCode = 0;
	public headers: Record<string, string> = {};
	code(num: number): void {
		this.statusCode = num;
	}
	header(key: string, value: string): void {
		this.headers[key] = value;
	}
}
class DummyRequest implements AuthSessionRequest {
	public ip = '0.0.0.0';
	public headers: Record<string, string | string[] | undefined> = { accept: 'application/json' };
	constructor(public body: AuthSessionBody) { }
}

describe('SigninWithPasskeyApiService', () => {
	let app: TestingModule;
	let passkeyProcedure: ReturnType<typeof createSigninWithPasskeyProcedure>;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let webAuthnService: WebAuthnService;
	let idService: IdService;
	let FakeWebauthnVerify: () => Promise<string>;
	async function createUser(data: Partial<MiUser> = {}) {
		const user = await usersRepository
			.save({
				...data,
			});
		return user;
	}

	async function createUserProfile(data: Partial<MiUserProfile> = {}) {
		const userProfile = await userProfilesRepository
			.save({ ...data },
			);
		return userProfile;
	}

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [
				{ provide: RateLimiterService, useClass: FakeLimiter },
				{ provide: SigninService, useClass: FakeSigninService },
			],
		}).useMocker((token) => {
			if (typeof token === 'function') {
				return mockDeep<typeof token>();
			}
		}).compile();
		passkeyProcedure = createSigninWithPasskeyProcedure({
			config: app.get<SigninWithPasskeyDependencies['config']>(DI.config),
			usersRepository: app.get<SigninWithPasskeyDependencies['usersRepository']>(DI.usersRepository),
			userProfilesRepository: app.get<SigninWithPasskeyDependencies['userProfilesRepository']>(DI.userProfilesRepository),
			signinsRepository: app.get<SigninWithPasskeyDependencies['signinsRepository']>(DI.signinsRepository),
			idService: app.get<SigninWithPasskeyDependencies['idService']>(IdService),
			rateLimiterService: app.get<SigninWithPasskeyDependencies['rateLimiterService']>(RateLimiterService),
			signinService: app.get<SigninWithPasskeyDependencies['signinService']>(SigninService),
			webAuthnService: app.get<SigninWithPasskeyDependencies['webAuthnService']>(WebAuthnService),
			loggerService: app.get<SigninWithPasskeyDependencies['loggerService']>(LoggerService),
		});
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		userProfilesRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
		webAuthnService = app.get<WebAuthnService>(WebAuthnService);
		idService = app.get<IdService>(IdService);
	});

	beforeEach(async () => {
		const uid = idService.gen();
		FakeWebauthnVerify = async () => {
			return uid;
		};
		vi.spyOn(webAuthnService, 'verifySignInWithPasskeyAuthentication').mockImplementation(FakeWebauthnVerify);
		vi.spyOn(webAuthnService, 'initiateSignInWithPasskeyAuthentication');

		const dummyUser = {
			id: uid, username: uid, usernameLower: uid.toLowerCase(), uri: null, host: null,
		};
		const dummyProfile = {
			userId: uid,
			password: 'qwerty',
			usePasswordLessLogin: true,
		};
		await createUser(dummyUser);
		await createUserProfile(dummyProfile);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Get Passkey Options', () => {
		it('Should return passkey Auth Options', async () => {
			const req = new DummyRequest({});
			const res = new DummyReply();
			const res_body = await call(passkeyProcedure, req.body, { context: { request: req, effects: res, response: {} } });
			expect(res.statusCode).toBe(200);
			if (!('option' in res_body)) throw new Error('Expected passkey options');
			expect(res_body.option).toBeDefined();
			expect(typeof res_body.context).toBe('string');
			expect(webAuthnService.initiateSignInWithPasskeyAuthentication).toHaveBeenCalledWith(res_body.context);
			expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
		});
	});
	describe('Try Passkey Auth', () => {
		// context is generated server-side by randomUUID(), and the API rejects anything that is not a UUID
		const dummyContext = '882042b6-bb28-4d79-8d63-f869488ef4ef';

		it('Should Success', async () => {
			const signin = vi.spyOn(app.get<SigninService>(SigninService), 'signin');
			const req = new DummyRequest({ context: dummyContext, credential: { dummy: [] } });
			const res = new DummyReply();
			const res_body = await call(passkeyProcedure, req.body, { context: { request: req, effects: res, response: {} } });
			if (!('signinResponse' in res_body)) throw new Error('Expected successful sign-in');
			expect(res_body.signinResponse).toBeDefined();
			expect(webAuthnService.verifySignInWithPasskeyAuthentication).toHaveBeenCalledWith(dummyContext, { dummy: [] });
			expect(signin).toHaveBeenCalledWith(req, res, expect.objectContaining({ id: await FakeWebauthnVerify() }));
		});

		it('Should return 400 Without Auth Context', async () => {
			const req = new DummyRequest({ credential: { dummy: [] } });
			const res = new DummyReply();
			const res_body = await call(passkeyProcedure, req.body, { context: { request: req, effects: res, response: {} } });
			expect(res.statusCode).toBe(400);
			if (!('error' in res_body) || res_body.error === undefined) throw new Error('Expected sign-in error');
			expect(res_body.error.id).toStrictEqual('1658cc2e-4495-461f-aee4-d403cdf073c1');
		});

		it('Should return 400 With Malformed Auth Context', async () => {
			const req = new DummyRequest({ context: 'misskey-1234', credential: { dummy: [] } });
			const res = new DummyReply();
			const res_body = await call(passkeyProcedure, req.body, { context: { request: req, effects: res, response: {} } });
			expect(res.statusCode).toBe(400);
			if (!('error' in res_body) || res_body.error === undefined) throw new Error('Expected sign-in error');
			expect(res_body.error.id).toStrictEqual('1658cc2e-4495-461f-aee4-d403cdf073c1');
		});

		it('Should return 403 When Challenge Verify fail', async () => {
			const req = new DummyRequest({ context: dummyContext, credential: { dummy: [] } });
			const res = new DummyReply();
			vi.spyOn(webAuthnService, 'verifySignInWithPasskeyAuthentication')
				.mockImplementation(async () => {
					throw new IdentifiableError('THIS_ERROR_CODE_SHOULD_BE_FORWARDED');
				});
			const res_body = await call(passkeyProcedure, req.body, { context: { request: req, effects: res, response: {} } });
			expect(res.statusCode).toBe(403);
			if (!('error' in res_body) || res_body.error === undefined) throw new Error('Expected sign-in error');
			expect(res_body.error.id).toStrictEqual('THIS_ERROR_CODE_SHOULD_BE_FORWARDED');
		});

		it('Should return 403 When The user not Enabled Passwordless login', async () => {
			const req = new DummyRequest({ context: dummyContext, credential: { dummy: [] } });
			const res = new DummyReply();
			const userId = await FakeWebauthnVerify();
			const data = { userId: userId, usePasswordLessLogin: false };
			await userProfilesRepository.update({ userId: userId }, data);
			const res_body = await call(passkeyProcedure, req.body, { context: { request: req, effects: res, response: {} } });
			expect(res.statusCode).toBe(403);
			if (!('error' in res_body) || res_body.error === undefined) throw new Error('Expected sign-in error');
			expect(res_body.error.id).toStrictEqual('2d84773e-f7b7-4d0b-8f72-bb69b584c912');
		});
	});
});
