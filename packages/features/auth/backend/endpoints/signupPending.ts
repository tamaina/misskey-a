/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { SignupService } from '@features/auth/backend/services/SignupService.js';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import { sessionField, sessionErrorMessage, type AuthSessionContext } from '../session.effects.js';
import { SigninService } from '../transport/SigninService.js';
import type { RegistrationTicketsRepository, UserPendingsRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authSessionsContract } from '../api.definition.js';
import { sessionErrors } from '../session.middleware.js';
const invitationCodeMailTimeoutMs = 1000 * 60 * 30;
export interface SignupPendingDependencies {
	userProfilesRepository: UserProfilesRepository;
	userPendingsRepository: Omit<UserPendingsRepository, 'findOneByOrFail' | 'insertOne'> & { findOneByOrFail(where: { code: import('@features/users/backend/json-value.schema.js').PackedJsonValue | undefined }): Promise<import('../models/UserPending.js').MiUserPending>; insertOne(entity: import('typeorm').QueryDeepPartialEntity<import('../models/UserPending.js').MiUserPending>): Promise<import('../models/UserPending.js').MiUserPending> };
	registrationTicketsRepository: RegistrationTicketsRepository;
	idService: Pick<IdService, 'parse'>;
	signupService: Pick<SignupService, 'signup'>;
	signinService: Pick<SigninService, 'signin'>;
}
export function createSignupPendingProcedure(deps: SignupPendingDependencies) {
	return implement(authSessionsContract.signupPending, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AuthSessionContext>().use(sessionErrors()).handler(async ({ input, context }) => {
		const body = input;
		const request = context.request;
		const reply = context.effects;
		const result = await (async () => {
			const code = sessionField(body, 'code');
			try {
				const pendingUser = await deps.userPendingsRepository.findOneByOrFail({ code });
				if (deps.idService.parse(pendingUser.id).date.getTime() + invitationCodeMailTimeoutMs < Date.now()) {
					throw new FastifyReplyError(400, 'EXPIRED');
				}
				const { account } = await deps.signupService.signup({
					username: pendingUser.username,
					passwordHash: pendingUser.password,
				});
				deps.userPendingsRepository.delete({
					id: pendingUser.id,
				});
				const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: account.id });
				await deps.userProfilesRepository.update({ userId: profile.userId }, {
					email: pendingUser.email,
					emailVerified: true,
					emailVerifyCode: null,
				});
				const ticket = await deps.registrationTicketsRepository.findOneBy({ pendingUserId: pendingUser.id });
				if (ticket) {
					await deps.registrationTicketsRepository.update(ticket.id, {
						usedBy: account,
						usedById: account.id,
						pendingUserId: null,
					});
				}
				return deps.signinService.signin(request, reply, account);
			} catch (err) {
				throw new FastifyReplyError(400, typeof err === 'string' ? err : sessionErrorMessage(err));
			}
		})();
		return v.parse(requiredSchema(authSessionsContract.signupPending['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
