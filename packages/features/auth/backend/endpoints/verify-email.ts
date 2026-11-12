/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { VerifyEmailContract } from '../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
export const meta = {

	tags: ['account'],

	errors: {
		noSuchCode: {
			message: 'No such code.',
			code: 'NO_SUCH_CODE',
			id: '97c1f576-e4b8-4b8a-a6dc-9cb65e7f6f85',
		},
	},
} as const;
export interface VerifyEmailDependencies {
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createVerifyEmailProcedure(deps: VerifyEmailDependencies) {
	return createApiProcedure<MiLocalUser>()(VerifyEmailContract).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			const profile = await deps.userProfilesRepository.findOneBy({
				emailVerifyCode: ps.code,
			});

			if (profile == null || profile.email == null) {
				throw apiError(meta.errors.noSuchCode);
			}

			const verified = await deps.userProfilesRepository.update({ userId: profile.userId, email: profile.email, emailVerifyCode: ps.code }, {
				emailVerified: true,
				emailVerifyCode: null,
			});

			if (verified.affected !== 1) throw apiError(meta.errors.noSuchCode);

			deps.globalEventService.publishMainStream(profile.userId, 'meUpdated', await deps.userEntityService.packSelf(profile.userId, {
				includeSecrets: true,
			}));
		})();
		return result;
	});
}
