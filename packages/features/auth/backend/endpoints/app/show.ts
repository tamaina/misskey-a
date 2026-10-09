/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { AppShowContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	tags: ['app'],

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3',
		},
	},
} as const;
export interface AppShowDependencies {
	appsRepository: AppsRepository;
	appEntityService: Pick<AppEntityService, 'pack'>;
}
export function createAppShowProcedure(deps: AppShowDependencies) {
	return implement(AppShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'app/show' })).handler(async ({ input, context }) => {
		const ps = input;
		const user = context.principal;
		const token = context.token;
		const result = await (async () => {
			const isSecure = user != null && token == null;

			// Lookup app
			const ap = await deps.appsRepository.findOneBy({ id: ps.appId });

			if (ap == null) {
				throw apiError(meta.errors.noSuchApp);
			}

			return await deps.appEntityService.pack(ap, user, {
				detail: true,
				includeSecret: isSecure && (ap.userId === user!.id),
			});
		})();
		return v.parse(requiredSchema(AppShowContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
