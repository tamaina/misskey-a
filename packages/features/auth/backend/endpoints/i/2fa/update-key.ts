/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { I2faUpdateKeyContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: 'f9c5467f-d492-4d3c-9a8g-a70dacc86512',
		},

		accessDenied: {
			message: 'You do not have edit privilege of this key.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fff-b8df-057708cce513',
		},
	},
} as const;
export interface I2faUpdateKeyDependencies {
	userSecurityKeysRepository: UserSecurityKeysRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faUpdateKeyProcedure(deps: I2faUpdateKeyDependencies) {
	return createApiProcedure<MiLocalUser>()(I2faUpdateKeyContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const key = await deps.userSecurityKeysRepository.findOneBy({
				id: ps.credentialId,
			});

			if (key == null) {
				throw apiError(meta.errors.noSuchKey);
			}

			if (key.userId !== me.id) {
				throw apiError(meta.errors.accessDenied);
			}

			await deps.userSecurityKeysRepository.update(key.id, {
				name: ps.name,
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {};
		})();
		return result;
	});
}
