/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import bcrypt from 'bcryptjs';

import type { MiMeta, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import type { Config } from '@/config.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { L_CHARS, secureRndstr } from '../../utility/secure-rndstr.js';
import { UserAuthService } from '../../services/UserAuthService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { IUpdateEmailContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export const meta = {

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: 'e54c1d7e-e7d6-4103-86b6-0a95069b4ad3',
		},

		unavailable: {
			message: 'Unavailable email address.',
			code: 'UNAVAILABLE',
			id: 'a2defefb-f220-8849-0af6-17f816099323',
		},

		emailRequired: {
			message: 'Email address is required.',
			code: 'EMAIL_REQUIRED',
			id: '324c7a88-59f2-492f-903f-89134f93e47e',
		},
	},
} as const;
export interface IUpdateEmailDependencies {
	config: Config;
	serverSettings: MiMeta;
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	emailService: Pick<EmailService, 'sendEmail' | 'validateEmailForAccount'>;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createIUpdateEmailProcedure(deps: IUpdateEmailDependencies) {
	return createApiProcedure<MiLocalUser>()(IUpdateEmailContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token;
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await deps.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					throw new Error('authentication failed');
				}
			}

			const passwordMatched = await bcrypt.compare(ps.password, profile.password!);
			if (!passwordMatched) {
				throw apiError(meta.errors.incorrectPassword);
			}

			if (ps.email != null) {
				const res = await deps.emailService.validateEmailForAccount(ps.email);
				if (!res.available) {
					throw apiError(meta.errors.unavailable);
				}
			} else if (deps.serverSettings.emailRequiredForSignup) {
				throw apiError(meta.errors.emailRequired);
			}

			await deps.userProfilesRepository.update(me.id, {
				email: ps.email,
				emailVerified: false,
				emailVerifyCode: null,
			});

			const iObj = await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', iObj);

			if (ps.email != null) {
				const code = secureRndstr(16, { chars: L_CHARS });

				await deps.userProfilesRepository.update(me.id, {
					emailVerifyCode: code,
				});

				const link = `${deps.config.url}/verify-email/${code}`;

				deps.emailService.sendEmail(ps.email, 'Email verification',
					`To verify email, please click this link:<br><a href="${link}">${link}</a>`,
					`To verify email, please click this link: ${link}`);
			}

			return iObj;
		})();
		return toPackedUserDetailed(result);
	});
}
