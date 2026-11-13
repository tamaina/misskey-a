/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { WebhookTestService } from '../../../services/WebhookTestService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { iWebhooksTestErrors, iWebhooksTestContract } from './test.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface IWebhooksTestDependencies {
	webhookTestService: Pick<WebhookTestService, 'testUserWebhook'>;
}
export function createIWebhooksTestProcedure(deps: IWebhooksTestDependencies) {
	return createApiProcedure<MiLocalUser>()(iWebhooksTestContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				try {
					await deps.webhookTestService.testUserWebhook({
						webhookId: ps.webhookId,
						type: ps.type,
						override: ps.override,
					}, me);
				} catch (e) {
					if (e instanceof WebhookTestService.NoSuchWebhookError) {
						throw apiError(iWebhooksTestErrors.noSuchWebhook);
					}
					throw e;
				}
			})();
			return result;
		});
}
