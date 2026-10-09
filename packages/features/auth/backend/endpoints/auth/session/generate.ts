/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import type { AppsRepository, AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Config } from '@/config.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { AuthSessionGenerateContract } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: '92f93e63-428e-4f2f-a5a4-39e1407fe998',
		},
	},
} as const;
export interface AuthSessionGenerateDependencies {
	config: Config;
	appsRepository: AppsRepository;
	authSessionsRepository: AuthSessionsRepository;
	idService: Pick<IdService, 'gen'>;
}
export function createAuthSessionGenerateProcedure(deps: AuthSessionGenerateDependencies) {
	return implement(AuthSessionGenerateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'auth/session/generate' })).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			// Lookup app
			const app = await deps.appsRepository.findOneBy({
				secret: ps.appSecret,
			});

			if (app == null) {
				throw apiError(meta.errors.noSuchApp);
			}

			// Generate token
			const token = randomUUID();

			// Create session token document
			const doc = await deps.authSessionsRepository.insertOne({
				id: deps.idService.gen(),
				appId: app.id,
				token: token,
			});

			return {
				token: doc.token,
				url: `${deps.config.authUrl}/${doc.token}`,
			};
		})();
		return v.parse(requiredSchema(AuthSessionGenerateContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
