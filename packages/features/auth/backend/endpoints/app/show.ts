/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { toPackedApp } from '../../auth.schema.js';
import { AppShowContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

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
	return createApiProcedure<MiLocalUser>()(AppShowContract).handler(async ({ input, context }) => {
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

			const includeSecret = isSecure && ap.userId === user?.id;
			return toPackedApp(await deps.appEntityService.pack(ap, user, {
				detail: true,
				includeSecret,
			}), includeSecret);
		})();
		return result;
	});
}
