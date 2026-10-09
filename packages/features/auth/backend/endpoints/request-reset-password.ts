/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { IsNull } from 'typeorm';
import type { PasswordResetRequestsRepository, UserProfilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';

import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Config } from '@/config.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { L_CHARS, secureRndstr } from '../utility/secure-rndstr.js';
import * as v from 'valibot';
import { RequestResetPasswordContract } from '../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../api/backend/transport/context.js';
export const meta = {
	tags: ['reset password'],

	requireCredential: false,

	description: 'Request a users password to be reset.',

	limit: {
		duration: ms('1hour'),
		max: 3,
	},

	errors: {

	},
} as const;
export interface RequestResetPasswordDependencies {
	config: Config;
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	passwordResetRequestsRepository: PasswordResetRequestsRepository;
	idService: Pick<IdService, 'gen'>;
	emailService: Pick<EmailService, 'sendEmail'>;
}
export function createRequestResetPasswordProcedure(deps: RequestResetPasswordDependencies) {
	return implement(RequestResetPasswordContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({
		name: 'request-reset-password', limit: {
			duration: 3600000,
			max: 3,
		}
	})).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			const user = await deps.usersRepository.findOneBy({
				usernameLower: ps.username.toLowerCase(),
				host: IsNull(),
			});

			// 合致するユーザーが登録されていなかったら無視
			if (user == null) {
				return;
			}

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });

			// 合致するメアドが登録されていなかったら無視
			if (profile.email !== ps.email) {
				return;
			}

			// メアドが認証されていなかったら無視
			if (!profile.emailVerified) {
				return;
			}

			const token = secureRndstr(64, { chars: L_CHARS });

			await deps.passwordResetRequestsRepository.insert({
				id: deps.idService.gen(),
				userId: profile.userId,
				token,
			});

			const link = `${deps.config.url}/reset-password/${token}`;

			deps.emailService.sendEmail(ps.email, 'Password reset requested',
				`To reset password, please click this link:<br><a href="${link}">${link}</a>`,
				`To reset password, please click this link: ${link}`);
		})();
		return v.parse(requiredSchema(RequestResetPasswordContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
