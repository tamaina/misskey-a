/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toSystemWebhook } from '../../../webhook.schema.js';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { adminSystemWebhookUpdateContract } from './update.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface AdminSystemWebhookUpdateDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'updateSystemWebhook'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'pack'>;
}
export function createAdminSystemWebhookUpdateProcedure(deps: AdminSystemWebhookUpdateDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSystemWebhookUpdateContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const result = await deps.systemWebhookService.updateSystemWebhook(
					{
						id: ps.id,
						isActive: ps.isActive,
						name: ps.name,
						on: ps.on,
						url: ps.url,
						secret: ps.secret,
					},
					me,
				);
				return toSystemWebhook(await deps.systemWebhookEntityService.pack(result));
			})();
			return result;
		});
}
