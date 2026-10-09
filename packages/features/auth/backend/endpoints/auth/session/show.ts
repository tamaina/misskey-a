/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { AuthSessionEntityService } from '../../../serializers/AuthSessionEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { AuthSessionShowContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
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
export interface AuthSessionShowDependencies {
	authSessionsRepository: AuthSessionsRepository;
	authSessionEntityService: Pick<AuthSessionEntityService, 'pack'>;
}
export function createAuthSessionShowProcedure(deps: AuthSessionShowDependencies) {
	return implement(AuthSessionShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'auth/session/show' })).handler(async ({ input, context }) => {
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
		return v.parse(requiredSchema(AuthSessionShowContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
