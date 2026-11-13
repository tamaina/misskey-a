/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toSystemWebhook } from '../../../webhook.schema.js';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { adminSystemWebhookShowErrors, adminSystemWebhookShowContract } from './show.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface AdminSystemWebhookShowDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'fetchSystemWebhooks'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'pack'>;
}
export function createAdminSystemWebhookShowProcedure(deps: AdminSystemWebhookShowDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSystemWebhookShowContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				const webhooks = await deps.systemWebhookService.fetchSystemWebhooks({ ids: [ps.id] });
				if (webhooks.length === 0) {
					throw apiError(adminSystemWebhookShowErrors.noSuchSystemWebhook);
				}
				return toSystemWebhook(await deps.systemWebhookEntityService.pack(webhooks[0]));
			})();
			return result;
		});
}
