/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type * as v from 'valibot';
import type { I2faPasswordLessContract } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		noKey: {
			message: 'No security key.',
			code: 'NO_SECURITY_KEY',
			id: 'f9c54d7f-d4c2-4d3c-9a8g-a70daac86512',
		},
	},
} as const;

@Injectable()
export class I2faPasswordLessOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof I2faPasswordLessContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		if (ps.value === true) {
			// セキュリティキーがなければパスワードレスを有効にはできない
			const keyCount = await this.userSecurityKeysRepository.count({
				where: {
					userId: me.id,
				},
				select: {
					id: true,
					name: true,
					lastUsed: true,
				},
			});

			if (keyCount === 0) {
				await this.userProfilesRepository.update(me.id, {
					usePasswordLessLogin: false,
				});

				throw apiError(meta.errors.noKey);
			}
		}

		await this.userProfilesRepository.update(me.id, {
			usePasswordLessLogin: ps.value,
		});

		// Publish meUpdated event
		this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.packSelf(me.id, {
			includeSecrets: true,
		}));
	}
}
