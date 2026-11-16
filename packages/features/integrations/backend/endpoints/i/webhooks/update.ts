/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { MiWebhook } from '../../../models/Webhook.js';
import { authorizeLegacyChatWebhook } from '../../../legacy-chat-authorization.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { iWebhooksUpdateErrors, iWebhooksUpdateContract } from './update.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface IWebhooksUpdateDependencies {
	webhooksRepository: WebhooksRepository;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
export function createIWebhooksUpdateProcedure(deps: IWebhooksUpdateDependencies) {
	return createApiProcedure<MiLocalUser>()(iWebhooksUpdateContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const updated = await deps.webhooksRepository.manager.transaction(async manager => {
				const repository = manager.getRepository(MiWebhook);
				// Serialize permission checks with changes to the event selection and destination.
				const webhook = await repository.findOne({ where: { id: ps.webhookId, userId: me.id, mode: 'legacy' }, lock: { mode: 'pessimistic_write' } });
				if (webhook === null) throw apiError(iWebhooksUpdateErrors.noSuchWebhook);
				const on = ps.on ?? webhook.on;
				// Even a partial URL/secret/active edit of a chat hook requires chat access.
				const chatAuthorization = webhook.on.includes('chatMessage') || on.includes('chatMessage')
					? authorizeLegacyChatWebhook(context.token) : {};
				await repository.update(webhook.id, { name: ps.name, url: ps.url, secret: ps.secret === null ? '' : ps.secret, on: ps.on, active: ps.active,
					...chatAuthorization,
					...(!on.includes('chatMessage') ? { chatTokenId: null } : {}),
				});
				return repository.findOneByOrFail({ id: ps.webhookId });
			});
			void deps.globalEventService.publishInternalEvent('webhookUpdated', updated);
		});
}
