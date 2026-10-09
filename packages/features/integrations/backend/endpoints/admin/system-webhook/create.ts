/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toSystemWebhook } from '../../../webhook.schema.js';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { adminSystemWebhookCreateContract } from './create.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface AdminSystemWebhookCreateDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'createSystemWebhook'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'pack'>;
}
export function createAdminSystemWebhookCreateProcedure(deps: AdminSystemWebhookCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSystemWebhookCreateContract)
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
				return toSystemWebhook(await deps.systemWebhookEntityService.pack(result));
			})();
			return result;
		});
}
