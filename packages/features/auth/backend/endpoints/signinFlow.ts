/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import bcrypt from 'bcryptjs';
import { performance } from 'node:perf_hooks';
import * as v from 'valibot';
import { SigninProgressController, signinProgressBinding, type SigninProgressStorage } from '../signin-progress.js';
import { signinProgressChallengeSchema } from '../signin-progress.schema.js';
import { IsNull } from 'typeorm';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import type { Config } from '@/config.js';
import { getIpHash } from '../utility/get-ip-hash.js';
import { toWebAuthnAuthenticationOptions } from '../webauthn.schema.js';
import { toSessionHeaders, toFinishedSignin } from '../session.schema.js';
import { sessionField, type AuthSessionContext } from '../session.effects.js';
import { SigninService } from '../transport/SigninService.js';
import type { MiMeta, UserProfilesRepository, UserSecurityKeysRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { SigninHistoryRepository } from '../session-signin-repository.js';
import { implement } from '@orpc/server';

import type { AuthSessionOutputs } from '../api.definition.js';
import { authSessionsContract } from '../api.definition.js';
import { sessionErrors } from '../session.middleware.js';
import { readMfaPolicy } from '../mfa-policy.js';
import { createSigninAssurance, signinPolicyStamp, SigninPolicyError } from '../signin-assurance.js';
import type { VerifiedSigninKey } from '../signin-assurance.js';
import { normalizedPasskeyPublicKey } from '../passkey-public-key.js';
export interface SigninFlowDependencies {
	config: Config;
	progressStore: SigninProgressStorage;
	meta: MiMeta;
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	userSecurityKeysRepository: UserSecurityKeysRepository;
	signinsRepository: SigninHistoryRepository;
	loggerService: Pick<LoggerService, 'getLogger'>;
	idService: Pick<IdService, 'gen'>;
	rateLimiterService: Pick<RateLimiterService, 'limit'>;
	signinService: Pick<SigninService, 'signin'>;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	webAuthnService: Pick<WebAuthnService, 'initiateAuthentication' | 'verifyAuthenticationWithProof'>;
	captchaService: Pick<CaptchaService, 'verifyHcaptcha' | 'verifyMcaptcha' | 'verifyRecaptcha' | 'verifyTestcaptcha' | 'verifyTurnstile'>;
}
export function createSigninFlowProcedure(deps: SigninFlowDependencies) {
	const logger = deps.loggerService.getLogger('Signin');
	const progress = new SigninProgressController(deps.progressStore);
	return implement(authSessionsContract.signinFlow, { initialInputValidationIndex: Number.POSITIVE_INFINITY, initialOutputValidationIndex: Number.NaN }).$context<AuthSessionContext>().use(sessionErrors()).handler(async ({ input, context }) => {
		const body = input;
		const request = context.request;
		const reply = context.effects;
		let deadline = performance.now() + 90_000;
		const result = await (async (): Promise<AuthSessionOutputs['signinFlow']> => {
			reply.header('Access-Control-Allow-Origin', deps.config.url);
			reply.header('Access-Control-Allow-Credentials', 'true');
			const username = sessionField(body, 'username');
			const password = sessionField(body, 'password');
			const token = sessionField(body, 'token');

			function error(status: number, error: { id: string }) {
				reply.code(status);
				return { error: { ...(error.id === undefined ? {} : { id: error.id }) } };
			}

			// not more than 1 attempt per second and not more than 10 attempts per hour
			if (deps.config.enableIpRateLimit) {
				if (process.env.NODE_ENV === 'production' && (request.ip === '::1' || request.ip === '127.0.0.1')) {
					logger.warn('Recieved signin request from localhost IP address for rate limiting in production environment. This is likely due to an improper trustProxy setting in the config file.');
				}
				const rateLimit = await deps.rateLimiterService.limit({ key: 'signin', duration: 60 * 60 * 1000, max: 10, minInterval: 1000 }, getIpHash(request.ip));
				if (rateLimit != null) {
					reply.code(429);
					return {
						error: {
							message: 'Too many failed attempts to sign in. Try again later.',
							code: 'TOO_MANY_AUTHENTICATION_FAILURES',
							id: '22d05606-fbcf-421a-a2db-b32610dcfd1b',
						},
					};
				}
			}
			if (typeof username !== 'string') {
				reply.code(400);
				return;
			}
			if (token != null && typeof token !== 'string') {
				reply.code(400);
				return;
			}
			const progressMode = sessionField(body, 'progressMode');
			const rawProgress = sessionField(body, 'authenticationProgress');
			const stateEnabled = progressMode === 'v1';
			if ((progressMode !== undefined && !stateEnabled) || (rawProgress !== undefined && !stateEnabled)) return error(400, { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
			const parsedProgress = rawProgress === undefined ? undefined : v.safeParse(signinProgressChallengeSchema, rawProgress);
			if (parsedProgress && !parsedProgress.success) return error(400, { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
			const challenge = parsedProgress?.success ? parsedProgress.output : undefined;
			// Fetch user
			const user = await deps.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: IsNull(),
			});
			if (user == null) {
				return error(404, {
					id: '6cc579cc-885d-43d8-95c2-b8c7fc963280',
				});
			}
			if (user.isSuspended || user.isDeleted) {
				return error(403, {
					id: 'e03a5f46-d309-4865-9b69-56282d94e1eb',
				});
			}
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });
			const keys = await deps.userSecurityKeysRepository.findBy({ userId: user.id });
			const policy = readMfaPolicy(profile, keys.length);
			const expected = signinPolicyStamp(user, profile, keys);
			const recoveryAvailable = Array.isArray(profile.twoFactorBackupSecret) && profile.twoFactorBackupSecret.length > 0;
			const availableFactors: ('totp' | 'passkey' | 'recovery')[] = [];
			if (policy.totp) availableFactors.push('totp');
			if (policy.passkey) availableFactors.push('passkey');
			if (policy.required && recoveryAvailable) availableFactors.push('recovery');
			if (password == null && !challenge) {
				reply.code(200);
				if (policy.required) {
					return {
						finished: false,
						next: 'password',
					};
				} else {
					return {
						finished: false,
						next: 'captcha',
					};
				}
			}
			if (!challenge && typeof password !== 'string') {
				reply.code(400);
				return;
			}
			// Establish the server deadline before password verification; continuations never repeat bcrypt.
			const progressExpiry = stateEnabled && !challenge ? await deps.progressStore.startDeadline(Math.floor(deadline - performance.now())) : undefined;
			const same = !('passwordLoginDisabled' in profile && profile.passwordLoginDisabled === true) && typeof profile.password === 'string' && profile.password.length > 0 && (challenge !== undefined || (typeof password === 'string' && await bcrypt.compare(password, profile.password)));
			const fail = async (status?: number, failure?: { id: string; }) => {
				// Append signin history
				await deps.signinsRepository.insert({
					id: deps.idService.gen(),
					userId: user.id,
					ip: request.ip,
					headers: toSessionHeaders(request.headers),
					success: false,
				});
				return error(status ?? 500, failure ?? { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
			};
			const finish = async (factor: 'none' | 'totp' | 'recovery' | 'passkey', key?: VerifiedSigninKey) => {
				try {
					const proof = createSigninAssurance({ userId: user.id, policyStamp: expected, mode: same ? 'password' : 'passwordless', passwordVerified: same, factor, ...(key ? { key } : {}), deadline });
					return toFinishedSignin(await deps.signinService.signin(request, reply, user, proof));
				} catch (err) {
					if (err instanceof SigninPolicyError) return fail(403, { id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f' });
					throw err;
				}
			};
			async function bindingFor(currentUser = user, currentProfile = profile) {
				const currentKeys = await deps.userSecurityKeysRepository.findBy({ userId: user.id });
				return signinProgressBinding({ userId: user.id, origin: deps.config.url, rpId: deps.config.hostname,
					captcha: [deps.meta.enableHcaptcha, deps.meta.enableMcaptcha, deps.meta.enableRecaptcha, deps.meta.enableTurnstile, deps.meta.enableTestcaptcha],
					passwordHash: currentProfile.password, totpEnabled: currentProfile.twoFactorEnabled,
					totpSecret: currentProfile.twoFactorSecret, passwordless: currentProfile.usePasswordLessLogin,
					independentPasskey: currentProfile.passkeyMfaEnabled, passwordLoginDisabled: 'passwordLoginDisabled' in currentProfile && currentProfile.passwordLoginDisabled === true, nativeToken: currentUser.token, keys: currentKeys });
			}
			const binding = stateEnabled && same && policy.required ? await bindingFor() : undefined;
			if (challenge && (!binding || !await progress.resume(binding, challenge))) return fail(403);
			async function verifyFactor(factor: 'totp' | 'passkey', verify: () => Promise<boolean>) {
				if (!stateEnabled || !same) return verify();
				if (!binding || !challenge) return false;
				return progress.finish(binding, challenge, factor, verify, async () => {
					const freshUser = await deps.usersRepository.findOneBy({ id: user.id, host: IsNull(), isSuspended: false, isDeleted: false });
					const freshProfile = await deps.userProfilesRepository.findOneBy({ userId: user.id });
					if (!freshUser || freshUser.host !== null || freshUser.isSuspended || freshUser.isDeleted || !freshProfile) return null;
					return bindingFor(freshUser, freshProfile);
				}, verifiedDeadline => { deadline = Math.min(deadline, verifiedDeadline); });
			}
			async function startProgress() { return binding ? { authenticationProgress: challenge ?? await progress.begin(binding, progressExpiry) } : {}; }

			if (!policy.required) {
				if (process.env.NODE_ENV !== 'test') {
					if (deps.meta.enableHcaptcha && deps.meta.hcaptchaSecretKey) {
						await deps.captchaService.verifyHcaptcha(deps.meta.hcaptchaSecretKey, sessionField(body, 'hcaptcha-response')).catch(err => {
							throw new FastifyReplyError(400, err);
						});
					}
					if (deps.meta.enableMcaptcha && deps.meta.mcaptchaSecretKey && deps.meta.mcaptchaSitekey && deps.meta.mcaptchaInstanceUrl) {
						await deps.captchaService.verifyMcaptcha(deps.meta.mcaptchaSecretKey, deps.meta.mcaptchaSitekey, deps.meta.mcaptchaInstanceUrl, sessionField(body, 'm-captcha-response')).catch(err => {
							throw new FastifyReplyError(400, err);
						});
					}
					if (deps.meta.enableRecaptcha && deps.meta.recaptchaSecretKey) {
						await deps.captchaService.verifyRecaptcha(deps.meta.recaptchaSecretKey, sessionField(body, 'g-recaptcha-response')).catch(err => {
							throw new FastifyReplyError(400, err);
						});
					}
					if (deps.meta.enableTurnstile && deps.meta.turnstileSecretKey) {
						await deps.captchaService.verifyTurnstile(deps.meta.turnstileSecretKey, sessionField(body, 'turnstile-response')).catch(err => {
							throw new FastifyReplyError(400, err);
						});
					}
					if (deps.meta.enableTestcaptcha) {
						await deps.captchaService.verifyTestcaptcha(sessionField(body, 'testcaptcha-response')).catch(err => {
							throw new FastifyReplyError(400, err);
						});
					}
				}
				if (same) {
					return finish('none');
				} else {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				}
			}
			if (token) {
				if (!same) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				}
				const recovery = Array.isArray(profile.twoFactorBackupSecret) && profile.twoFactorBackupSecret.includes(token);
				if (!recovery && !policy.totp) return fail(403, { id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f' });
				try {
					const authorized = await verifyFactor('totp', async () => {
						await deps.userAuthService.twoFactorAuthenticate(profile, token);
						return true;
					});
					if (!authorized) return await fail(403, { id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f' });
				} catch (_) {
					return await fail(403, {
						id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f',
					});
				}
				return finish(recovery ? 'recovery' : 'totp');
			} else if (sessionField(body, 'credential')) {
				if (!policy.passkey || (!same && (policy.independentPasskeyEnabled || !profile.usePasswordLessLogin))) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				}
				try {
					let verifiedKey: VerifiedSigninKey | undefined;
					const authorized = await verifyFactor('passkey', async () => {
						const verified = await deps.webAuthnService.verifyAuthenticationWithProof(user.id, sessionField(body, 'credential'), async key => {
							if (key.userId !== user.id || !keys.some(stored => stored.id === key.id && normalizedPasskeyPublicKey(stored.publicKey) === key.publicKey)) throw new SigninPolicyError();
							return expected;
						}, !same);
						if (verified?.expected !== expected) return false;
						verifiedKey = verified.key;
						return true;
					});
					if (authorized && verifiedKey) return finish('passkey', verifiedKey);
				} catch (_) {
					return await fail(403, {
						id: '93b86c4b-72f9-40eb-9815-798928603d1e',
					});
				}
				return fail(403, { id: '93b86c4b-72f9-40eb-9815-798928603d1e' });
			} else if (policy.passkey) {
				if (!same && (policy.independentPasskeyEnabled || !profile.usePasswordLessLogin)) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				}
				const authRequest = toWebAuthnAuthenticationOptions(await deps.webAuthnService.initiateAuthentication(user.id, undefined, !same));
				reply.code(200);
				return {
					finished: false,
					next: 'passkey',
					...await startProgress(),
					authRequest,
					...(same ? { availableFactors } : {}),
				};
			} else {
				if (!same || availableFactors.length === 0) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				} else {
					reply.code(200);
					return {
						finished: false,
						next: 'totp',
						...await startProgress(),
						availableFactors,
					};
				}
			}
			// never get here
		})();
		return result;
	});
}
