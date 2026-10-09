/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { iWebhooksDeleteErrors, iWebhooksDeleteContract } from './delete.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface IWebhooksDeleteDependencies {
	webhooksRepository: WebhooksRepository;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
export function createIWebhooksDeleteProcedure(deps: IWebhooksDeleteDependencies) {
	return createApiProcedure<MiLocalUser>()(iWebhooksDeleteContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const webhook = await deps.webhooksRepository.findOneBy({ id: ps.webhookId, userId: me.id });
			if (webhook === null) throw apiError(iWebhooksDeleteErrors.noSuchWebhook);
			await deps.webhooksRepository.delete(webhook.id);
			void deps.globalEventService.publishInternalEvent('webhookDeleted', webhook);
		});
}
