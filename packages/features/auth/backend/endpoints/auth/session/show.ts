/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { AuthSessionEntityService } from '../../../serializers/AuthSessionEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { toPackedApp } from '../../../auth.schema.js';
import { AuthSessionShowContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['auth'],

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: 'bd72c97d-eba7-4adb-a467-f171b8847250',
		},
	},
} as const;
export interface AuthSessionShowDependencies {
	authSessionsRepository: AuthSessionsRepository;
	authSessionEntityService: Pick<AuthSessionEntityService, 'pack'>;
}
export function createAuthSessionShowProcedure(deps: AuthSessionShowDependencies) {
	return createApiProcedure<MiLocalUser>()(AuthSessionShowContract).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			// Lookup session
			const session = await deps.authSessionsRepository.findOneBy({
				token: ps.token,
			});

			if (session == null) {
				throw apiError(meta.errors.noSuchSession);
			}

			return await deps.authSessionEntityService.pack(session, me);
		})();
		return { id: result.id, app: toPackedApp(result.app), token: result.token };
	});
}
