/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { AuthSessionEntityService } from '../../../serializers/AuthSessionEntityService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type * as v from 'valibot';
import type { AuthSessionShowContract } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: 'bd72c97d-eba7-4adb-a467-f171b8847250',
		},
	},
} as const;

@Injectable()
export class AuthSessionShowOperation {
	constructor(
		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private authSessionEntityService: AuthSessionEntityService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof AuthSessionShowContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		// Lookup session
		const session = await this.authSessionsRepository.findOneBy({
			token: ps.token,
		});

		if (session == null) {
			throw apiError(meta.errors.noSuchSession);
		}

		return await this.authSessionEntityService.pack(session, me);
	}
}
