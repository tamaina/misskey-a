/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository, AccessTokensRepository, AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { packedAuthSessionUserkeyInput } from '../../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'fcab192a-2c5a-43b7-8ad8-9b7054d8d40d',
		},

		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '5b5a1503-8bc8-4bd0-8054-dc189e8cdcb3',
		},

		pendingSession: {
			message: 'This session is not completed yet.',
			code: 'PENDING_SESSION',
			id: '8c8a4145-02cc-4cca-8e66-29ba60445a8e',
		},
	},
} as const;

@Injectable()
export class AuthSessionUserkeyOperation {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private userEntityService: UserEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof packedAuthSessionUserkeyInput>, me: MiLocalUser | null) {
		// Lookup app
		const app = await this.appsRepository.findOneBy({
			secret: ps.appSecret,
		});

		if (app == null) {
			throw apiError(meta.errors.noSuchApp);
		}

		// Fetch token
		const session = await this.authSessionsRepository.findOneBy({
			token: ps.token,
			appId: app.id,
		});

		if (session == null) {
			throw apiError(meta.errors.noSuchSession);
		}

		if (session.userId == null) {
			throw apiError(meta.errors.pendingSession);
		}

		// Lookup access token
		const accessToken = await this.accessTokensRepository.findOneByOrFail({
			appId: app.id,
			userId: session.userId,
		});

		// Delete session
		this.authSessionsRepository.delete(session.id);

		return {
			accessToken: accessToken.token,
			user: await this.userEntityService.pack(session.userId, null, {
				schema: 'UserDetailedNotMe',
			}),
		};
	}
}
