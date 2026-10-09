/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { iWebhooksShowErrors, iWebhooksShowContract } from './show.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface IWebhooksShowDependencies {
	webhooksRepository: WebhooksRepository;
}
export function createIWebhooksShowProcedure(deps: IWebhooksShowDependencies) {
	return createApiProcedure<MiLocalUser>()(iWebhooksShowContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const webhook = await deps.webhooksRepository.findOneBy({
					id: ps.webhookId,
					userId: me.id,
				});
				if (webhook == null) {
					throw apiError(iWebhooksShowErrors.noSuchWebhook);
				}
				return {
					id: webhook.id,
					userId: webhook.userId,
					name: webhook.name,
					on: webhook.on,
					url: webhook.url,
					secret: webhook.secret,
					active: webhook.active,
					latestSentAt: webhook.latestSentAt ? webhook.latestSentAt.toISOString() : null,
					latestStatus: webhook.latestStatus,
				};
			})();
			return result;
		});
}
