/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { toPackedApp } from '../../auth.schema.js';
import { MyAppsContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['account', 'app'],

} as const;
export interface MyAppsDependencies {
	appsRepository: AppsRepository;
	appEntityService: Pick<AppEntityService, 'pack'>;
}
export function createMyAppsProcedure(deps: MyAppsDependencies) {
	return createApiProcedure<MiLocalUser>()(MyAppsContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const query = {
				userId: me.id,
			};

			const apps = await deps.appsRepository.find({
				where: query,
				take: ps.limit,
				skip: ps.offset,
			});

			return await Promise.all(apps.map(app => deps.appEntityService.pack(app, me, {
				detail: true,
			})));
		})();
		return result.map(app => toPackedApp(app));
	});
}
