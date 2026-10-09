/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { voidVerifyEmailInput } from '../auth.schema.js';

export const meta = {
	requireCredential: false,

	tags: ['account'],

	errors: {
		noSuchCode: {
			message: 'No such code.',
			code: 'NO_SUCH_CODE',
			id: '97c1f576-e4b8-4b8a-a6dc-9cb65e7f6f85',
		},
	},
} as const;

@Injectable()
export class VerifyEmailOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<typeof voidVerifyEmailInput>) {
		const profile = await this.userProfilesRepository.findOneBy({
			emailVerifyCode: ps.code,
		});

		if (profile == null) {
			throw apiError(meta.errors.noSuchCode);
		}

		await this.userProfilesRepository.update({ userId: profile.userId }, {
			emailVerified: true,
			emailVerifyCode: null,
		});

		this.globalEventService.publishMainStream(profile.userId, 'meUpdated', await this.userEntityService.packSelf(profile.userId, {
			includeSecrets: true,
		}));
	}
}
