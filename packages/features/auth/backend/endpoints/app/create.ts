/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { unique } from '@features/runtime/backend/data/array.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import * as v from 'valibot';
import { AppCreateContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	tags: ['app'],

	requireCredential: false,
} as const;
export interface AppCreateDependencies {
	appsRepository: AppsRepository;
	appEntityService: Pick<AppEntityService, 'pack'>;
	idService: Pick<IdService, 'gen'>;
}
export function createAppCreateProcedure(deps: AppCreateDependencies) {
	return implement(AppCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'app/create' })).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			// Generate secret
			const secret = secureRndstr(32);

			// for backward compatibility
			const permission = unique(ps.permission.map(v => v.replace(/^(.+)(\/|-)(read|write)$/, '$3:$1')));

			// Create account
			const app = await deps.appsRepository.insertOne({
				id: deps.idService.gen(),
				userId: me ? me.id : null,
				name: ps.name,
				description: ps.description,
				permission,
				callbackUrl: ps.callbackUrl,
				secret: secret,
			});

			return await deps.appEntityService.pack(app, null, {
				detail: true,
				includeSecret: true,
			});
		})();
		return v.parse(requiredSchema(AppCreateContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
