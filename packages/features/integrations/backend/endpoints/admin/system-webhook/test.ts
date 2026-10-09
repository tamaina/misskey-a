/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { WebhookTestService } from '../../../services/WebhookTestService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { adminSystemWebhookTestErrors, adminSystemWebhookTestContract } from './test.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface AdminSystemWebhookTestDependencies {
	webhookTestService: Pick<WebhookTestService, 'testSystemWebhook'>;
}
export function createAdminSystemWebhookTestProcedure(deps: AdminSystemWebhookTestDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSystemWebhookTestContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				try {
					await deps.webhookTestService.testSystemWebhook({
						webhookId: ps.webhookId,
						type: ps.type,
						override: ps.override,
					});
				} catch (e) {
					if (e instanceof WebhookTestService.NoSuchWebhookError) {
						throw apiError(adminSystemWebhookTestErrors.noSuchWebhook);
					}
					throw e;
				}
			})();
			return result;
		});
}
