/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookListContract } from './list.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
export interface AdminSystemWebhookListDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'fetchSystemWebhooks'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'packMany'>;
}
export function createAdminSystemWebhookListProcedure(deps: AdminSystemWebhookListDependencies) {
	return implement(adminSystemWebhookListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: 'admin/system-webhook/list', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:system-webhook' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				const webhooks = await deps.systemWebhookService.fetchSystemWebhooks({
					isActive: ps.isActive,
					on: ps.on,
				});
				return deps.systemWebhookEntityService.packMany(webhooks);
			})();
			return v.parse(requiredSchema(adminSystemWebhookListContract['~orpc'].outputSchema), result);
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
