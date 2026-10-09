/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import bcrypt from 'bcryptjs';
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
import { toSessionHeaders } from '../session.schema.js';
import { sessionField, type AuthSessionContext } from '../session.effects.js';
import { SigninService } from '../transport/SigninService.js';
import type { MiMeta, UserProfilesRepository, UserSecurityKeysRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { SigninHistoryRepository } from '../session-signin-repository.js';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authSessionsContract } from '../session.contract.js';
import { sessionErrors } from '../session.middleware.js';
export interface SigninFlowDependencies {
	config: Config;
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
	webAuthnService: Pick<WebAuthnService, 'initiateAuthentication' | 'verifyAuthentication'>;
	captchaService: Pick<CaptchaService, 'verifyHcaptcha' | 'verifyMcaptcha' | 'verifyRecaptcha' | 'verifyTestcaptcha' | 'verifyTurnstile'>;
}
export function createSigninFlowProcedure(deps: SigninFlowDependencies) {
	const logger = deps.loggerService.getLogger('Signin');
	return implement(authSessionsContract.signinFlow, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AuthSessionContext>().use(sessionErrors()).handler(async ({ input, context }) => {
		const body = input;
		const request = context.request;
		const reply = context.effects;
		const result = await (async () => {
			reply.header('Access-Control-Allow-Origin', deps.config.url);
			reply.header('Access-Control-Allow-Credentials', 'true');
			const username = sessionField(body, 'username');
			const password = sessionField(body, 'password');
			const token = sessionField(body, 'token');

			function error(status: number, error: { id: string }) {
				reply.code(status);
				return { error };
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
			if (user.isSuspended) {
				return error(403, {
					id: 'e03a5f46-d309-4865-9b69-56282d94e1eb',
				});
			}
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });
			const securityKeysAvailable = await deps.userSecurityKeysRepository.countBy({ userId: user.id }).then(result => result >= 1);
			if (password == null) {
				reply.code(200);
				if (profile.twoFactorEnabled) {
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
			if (typeof password !== 'string') {
				reply.code(400);
				return;
			}
			// Compare password
			const same = await bcrypt.compare(password, profile.password!);
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
			if (!profile.twoFactorEnabled) {
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
					return deps.signinService.signin(request, reply, user);
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
				try {
					await deps.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					return await fail(403, {
						id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f',
					});
				}
				return deps.signinService.signin(request, reply, user);
			} else if (sessionField(body, 'credential')) {
				if (!same && !profile.usePasswordLessLogin) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				}
				const authorized = await deps.webAuthnService.verifyAuthentication(user.id, sessionField(body, 'credential'));
				if (authorized) {
					return deps.signinService.signin(request, reply, user);
				} else {
					return await fail(403, {
						id: '93b86c4b-72f9-40eb-9815-798928603d1e',
					});
				}
			} else if (securityKeysAvailable) {
				if (!same && !profile.usePasswordLessLogin) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				}
				const authRequest = toWebAuthnAuthenticationOptions(await deps.webAuthnService.initiateAuthentication(user.id));
				reply.code(200);
				return {
					finished: false,
					next: 'passkey',
					authRequest,
				};
			} else {
				if (!same || !profile.twoFactorEnabled) {
					return await fail(403, {
						id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
					});
				} else {
					reply.code(200);
					return {
						finished: false,
						next: 'totp',
					};
				}
			}
			// never get here
		})();
		return v.parse(requiredSchema(authSessionsContract.signinFlow['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
