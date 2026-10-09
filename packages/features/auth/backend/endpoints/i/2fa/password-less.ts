/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { I2faPasswordLessContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

	errors: {
		noKey: {
			message: 'No security key.',
			code: 'NO_SECURITY_KEY',
			id: 'f9c54d7f-d4c2-4d3c-9a8g-a70daac86512',
		},
	},
} as const;
export interface I2faPasswordLessDependencies {
	userProfilesRepository: UserProfilesRepository;
	userSecurityKeysRepository: UserSecurityKeysRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faPasswordLessProcedure(deps: I2faPasswordLessDependencies) {
	return createApiProcedure<MiLocalUser>()(I2faPasswordLessContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			if (ps.value === true) {
				// セキュリティキーがなければパスワードレスを有効にはできない
				const keyCount = await deps.userSecurityKeysRepository.count({
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
					await deps.userProfilesRepository.update(me.id, {
						usePasswordLessLogin: false,
					});

					throw apiError(meta.errors.noKey);
				}
			}

			await deps.userProfilesRepository.update(me.id, {
				usePasswordLessLogin: ps.value,
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));
		})();
		return result;
	});
}
