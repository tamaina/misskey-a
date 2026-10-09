/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { iWebhooksListContract } from './list.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface IWebhooksListDependencies {
	webhooksRepository: WebhooksRepository;
}
export function createIWebhooksListProcedure(deps: IWebhooksListDependencies) {
	return createApiProcedure<MiLocalUser>()(iWebhooksListContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const result = await (async () => {
				const webhooks = await deps.webhooksRepository.findBy({
					userId: me.id,
				});
				return webhooks.map(webhook => ({
					id: webhook.id,
					userId: webhook.userId,
					name: webhook.name,
					on: webhook.on,
					url: webhook.url,
					secret: webhook.secret,
					active: webhook.active,
					latestSentAt: webhook.latestSentAt ? webhook.latestSentAt.toISOString() : null,
					latestStatus: webhook.latestStatus,
				}));
			})();
			return result;
		});
}
