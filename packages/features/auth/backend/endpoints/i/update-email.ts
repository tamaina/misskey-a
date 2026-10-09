/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import bcrypt from 'bcryptjs';

import type { MiMeta, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { L_CHARS, secureRndstr } from '../../utility/secure-rndstr.js';
import { UserAuthService } from '../../services/UserAuthService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type * as v from 'valibot';
import type { IUpdateEmailContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	limit: {
		duration: ms('1hour'),
		max: 3,
	},

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

@Injectable()
export class IUpdateEmailOperation {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private emailService: EmailService,
		private userAuthService: UserAuthService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof IUpdateEmailContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const token = ps.token;
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

		if (profile.twoFactorEnabled) {
			if (token == null) {
				throw new Error('authentication failed');
			}

			try {
				await this.userAuthService.twoFactorAuthenticate(profile, token);
			} catch (_) {
				throw new Error('authentication failed');
			}
		}

		const passwordMatched = await bcrypt.compare(ps.password, profile.password!);
		if (!passwordMatched) {
			throw apiError(meta.errors.incorrectPassword);
		}

		if (ps.email != null) {
			const res = await this.emailService.validateEmailForAccount(ps.email);
			if (!res.available) {
				throw apiError(meta.errors.unavailable);
			}
		} else if (this.serverSettings.emailRequiredForSignup) {
			throw apiError(meta.errors.emailRequired);
		}

		await this.userProfilesRepository.update(me.id, {
			email: ps.email,
			emailVerified: false,
			emailVerifyCode: null,
		});

		const iObj = await this.userEntityService.packSelf(me.id, {
			includeSecrets: true,
		});

		// Publish meUpdated event
		this.globalEventService.publishMainStream(me.id, 'meUpdated', iObj);

		if (ps.email != null) {
			const code = secureRndstr(16, { chars: L_CHARS });

			await this.userProfilesRepository.update(me.id, {
				emailVerifyCode: code,
			});

			const link = `${this.config.url}/verify-email/${code}`;

			this.emailService.sendEmail(ps.email, 'Email verification',
				`To verify email, please click this link:<br><a href="${link}">${link}</a>`,
				`To verify email, please click this link: ${link}`);
		}

		return iObj;
	}
}
