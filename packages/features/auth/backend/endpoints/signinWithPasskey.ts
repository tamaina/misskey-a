/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomUUID } from 'crypto';
import { IsNull } from 'typeorm';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import type { Config } from '@/config.js';
import { getIpHash } from '../utility/get-ip-hash.js';
import { toWebAuthnAuthenticationOptions } from '../webauthn.schema.js';
import { toSessionHeaders } from '../session.schema.js';
import { sessionField, type AuthSessionContext } from '../session.effects.js';
import { SigninService } from '../transport/SigninService.js';
import type { UserProfilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { SigninHistoryRepository } from '../session-signin-repository.js';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authSessionsContract } from '../api.definition.js';
import { sessionErrors } from '../session.middleware.js';
export interface SigninWithPasskeyDependencies {
	config: Config;
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	signinsRepository: SigninHistoryRepository;
	idService: Pick<IdService, 'gen'>;
	rateLimiterService: Pick<RateLimiterService, 'limit'>;
	signinService: Pick<SigninService, 'signin'>;
	webAuthnService: Pick<WebAuthnService, 'initiateSignInWithPasskeyAuthentication' | 'verifySignInWithPasskeyAuthentication'>;
	loggerService: Pick<LoggerService, 'getLogger'>;
}
export function createSigninWithPasskeyProcedure(deps: SigninWithPasskeyDependencies) {
	const logger = deps.loggerService.getLogger('PasskeyAuth');
	return implement(authSessionsContract.signinWithPasskey, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AuthSessionContext>().use(sessionErrors()).handler(async ({ input, context }) => {
		const body = input;
		const request = context.request;
		const reply = context.effects;
		const result = await (async () => {
			reply.header('Access-Control-Allow-Origin', deps.config.url);
			reply.header('Access-Control-Allow-Credentials', 'true');
			const credential = sessionField(body, 'credential');

			function error(status: number, error: { id?: string }) {
				reply.code(status);
				return { error };
			}

			const fail = async (userId: MiUser['id'], status?: number, failure?: { id: string }) => {
				// Append signin history
				await deps.signinsRepository.insert({
					id: deps.idService.gen(),
					userId: userId,
					ip: request.ip,
					headers: toSessionHeaders(request.headers),
					success: false,
				});
				return error(status ?? 500, failure ?? { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
			};
			if (deps.config.enableIpRateLimit) {
				if (process.env.NODE_ENV === 'production' && (request.ip === '::1' || request.ip === '127.0.0.1')) {
					logger.warn('Recieved signin with passkey request from localhost IP address for rate limiting in production environment. This is likely due to an improper trustProxy setting in the config file.');
				}
				// Not more than 1 API call per 250ms and not more than 100 attempts per 30min
				// NOTE: 1 Sign-in require 2 API calls
				const rateLimit = await deps.rateLimiterService.limit({ key: 'signin-with-passkey', duration: 60 * 30 * 1000, max: 200, minInterval: 250 }, getIpHash(request.ip));
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
			// Initiate Passkey Auth challenge with context
			if (!credential) {
				const context = randomUUID();
				logger.info(`Initiate Passkey challenge: context: ${context}`);
				const authChallengeOptions = {
					option: toWebAuthnAuthenticationOptions(await deps.webAuthnService.initiateSignInWithPasskeyAuthentication(context)),
					context: context,
				};
				reply.code(200);
				return authChallengeOptions;
			}
			const context = sessionField(body, 'context');
			// context is always generated server-side by randomUUID(), so reject anything that is not a UUID
			if (!context || typeof context !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(context)) {
				// If try Authentication without valid context
				return error(400, {
					id: '1658cc2e-4495-461f-aee4-d403cdf073c1',
				});
			}
			logger.debug(`Try Sign-in with Passkey: context: ${context}`);
			let authorizedUserId: MiUser['id'] | null;
			try {
				authorizedUserId = await deps.webAuthnService.verifySignInWithPasskeyAuthentication(context, credential);
			} catch (err) {
				logger.warn(`Passkey challenge Verify error! : ${err}`);
				const errorId = err instanceof IdentifiableError ? err.id : undefined;
				return error(403, {
					id: errorId,
				});
			}
			if (!authorizedUserId) {
				return error(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
			}
			// Fetch user
			const user = await deps.usersRepository.findOneBy({
				id: authorizedUserId,
				host: IsNull(),
			});
			if (user == null) {
				return error(403, {
					id: '652f899f-66d4-490e-993e-6606c8ec04c3',
				});
			}
			if (user.isSuspended) {
				return error(403, {
					id: 'e03a5f46-d309-4865-9b69-56282d94e1eb',
				});
			}
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });
			// Authentication was successful, but passwordless login is not enabled
			if (!profile.usePasswordLessLogin) {
				return await fail(user.id, 403, {
					id: '2d84773e-f7b7-4d0b-8f72-bb69b584c912',
				});
			}
			const signinResponse = deps.signinService.signin(request, reply, user);
			return {
				signinResponse: signinResponse,
			};
		})();
		return v.parse(requiredSchema(authSessionsContract.signinWithPasskey['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
