/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toSystemWebhook } from '../../../webhook.schema.js';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { adminSystemWebhookListContract } from './list.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface AdminSystemWebhookListDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'fetchSystemWebhooks'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'packMany'>;
}
export function createAdminSystemWebhookListProcedure(deps: AdminSystemWebhookListDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSystemWebhookListContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				const webhooks = await deps.systemWebhookService.fetchSystemWebhooks({
					isActive: ps.isActive,
					on: ps.on,
				});
				return (await deps.systemWebhookEntityService.packMany(webhooks)).map(toSystemWebhook);
			})();
			return result;
		});
}
