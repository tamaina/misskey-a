/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import * as v from 'valibot';
import { MyAppsContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	tags: ['account', 'app'],

	requireCredential: true,
	kind: 'read:account',
} as const;
export interface MyAppsDependencies {
	appsRepository: AppsRepository;
	appEntityService: Pick<AppEntityService, 'pack'>;
}
export function createMyAppsProcedure(deps: MyAppsDependencies) {
	return implement(MyAppsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'my/apps', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
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
		return v.parse(requiredSchema(MyAppsContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
