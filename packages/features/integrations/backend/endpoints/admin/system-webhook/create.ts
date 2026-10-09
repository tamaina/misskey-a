/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookCreateContract } from './create.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
export interface AdminSystemWebhookCreateDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'createSystemWebhook'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'pack'>;
}
export function createAdminSystemWebhookCreateProcedure(deps: AdminSystemWebhookCreateDependencies) {
	return implement(adminSystemWebhookCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: 'admin/system-webhook/create', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:system-webhook' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const result = await deps.systemWebhookService.createSystemWebhook(
					{
						isActive: ps.isActive,
						name: ps.name,
						on: ps.on,
						url: ps.url,
						secret: ps.secret,
					},
					me,
				);
				return deps.systemWebhookEntityService.pack(result);
			})();
			return v.parse(requiredSchema(adminSystemWebhookCreateContract['~orpc'].outputSchema), result);
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
