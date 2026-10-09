/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { getIpHash } from '../utility/get-ip-hash.js';
import { toWebAuthnAuthenticationOptions } from '../webauthn.schema.js';
import { toSessionHeaders } from '../session.schema.js';
import { sessionField, sessionText, sessionErrorMessage, type AuthSessionBody, type AuthSessionRequest, type AuthSessionEffects } from '../session.effects.js';
import { SigninService } from './SigninService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import type {
	MiMeta,
	UserProfilesRepository,
	UserSecurityKeysRepository,
	UsersRepository,
} from '@features/persistence/backend/repositories/models.js';
import type { SigninHistoryRepository } from '../session-signin-repository.js';

@Injectable()
export class SigninApiService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninHistoryRepository,

		private loggerService: LoggerService,
		private idService: IdService,
		private rateLimiterService: RateLimiterService,
		private signinService: SigninService,
		private userAuthService: UserAuthService,
		private webAuthnService: WebAuthnService,
		private captchaService: CaptchaService,
	) {
		this.logger = this.loggerService.getLogger('Signin');
	}

	@bindThis
	public async signin(
		body: AuthSessionBody,
		request: AuthSessionRequest,
		reply: AuthSessionEffects,
	) {
		reply.header('Access-Control-Allow-Origin', this.config.url);
		reply.header('Access-Control-Allow-Credentials', 'true');

		const username = sessionField(body, 'username');
		const password = sessionField(body, 'password');
		const token = sessionField(body, 'token');

		function error(status: number, error: { id: string }) {
			reply.code(status);
			return { error };
		}

		// not more than 1 attempt per second and not more than 10 attempts per hour
		if (this.config.enableIpRateLimit) {
			if (process.env.NODE_ENV === 'production' && (request.ip === '::1' || request.ip === '127.0.0.1')) {
				this.logger.warn('Recieved signin request from localhost IP address for rate limiting in production environment. This is likely due to an improper trustProxy setting in the config file.');
			}
			const rateLimit = await this.rateLimiterService.limit({ key: 'signin', duration: 60 * 60 * 1000, max: 10, minInterval: 1000 }, getIpHash(request.ip));
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
		const user = await this.usersRepository.findOneBy({
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

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
		const securityKeysAvailable = await this.userSecurityKeysRepository.countBy({ userId: user.id }).then(result => result >= 1);

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
			await this.signinsRepository.insert({
				id: this.idService.gen(),
				userId: user.id,
				ip: request.ip,
				headers: toSessionHeaders(request.headers),
				success: false,
			});

			return error(status ?? 500, failure ?? { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
		};

		if (!profile.twoFactorEnabled) {
			if (process.env.NODE_ENV !== 'test') {
				if (this.meta.enableHcaptcha && this.meta.hcaptchaSecretKey) {
					await this.captchaService.verifyHcaptcha(this.meta.hcaptchaSecretKey, sessionField(body, 'hcaptcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (this.meta.enableMcaptcha && this.meta.mcaptchaSecretKey && this.meta.mcaptchaSitekey && this.meta.mcaptchaInstanceUrl) {
					await this.captchaService.verifyMcaptcha(this.meta.mcaptchaSecretKey, this.meta.mcaptchaSitekey, this.meta.mcaptchaInstanceUrl, sessionField(body, 'm-captcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (this.meta.enableRecaptcha && this.meta.recaptchaSecretKey) {
					await this.captchaService.verifyRecaptcha(this.meta.recaptchaSecretKey, sessionField(body, 'g-recaptcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (this.meta.enableTurnstile && this.meta.turnstileSecretKey) {
					await this.captchaService.verifyTurnstile(this.meta.turnstileSecretKey, sessionField(body, 'turnstile-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (this.meta.enableTestcaptcha) {
					await this.captchaService.verifyTestcaptcha(sessionField(body, 'testcaptcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
			}

			if (same) {
				return this.signinService.signin(request, reply, user);
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
				await this.userAuthService.twoFactorAuthenticate(profile, token);
			} catch (_) {
				return await fail(403, {
					id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f',
				});
			}

			return this.signinService.signin(request, reply, user);
		} else if (sessionField(body, 'credential')) {
			if (!same && !profile.usePasswordLessLogin) {
				return await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
			}

			const authorized = await this.webAuthnService.verifyAuthentication(user.id, sessionField(body, 'credential'));

			if (authorized) {
				return this.signinService.signin(request, reply, user);
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

			const authRequest = toWebAuthnAuthenticationOptions(await this.webAuthnService.initiateAuthentication(user.id));

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
	}
}
