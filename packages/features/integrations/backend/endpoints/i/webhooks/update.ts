/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
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
			const webhook = await deps.webhooksRepository.findOneBy({ id: ps.webhookId, userId: me.id });
			if (webhook === null) throw apiError(iWebhooksUpdateErrors.noSuchWebhook);
			await deps.webhooksRepository.update(webhook.id, { name: ps.name, url: ps.url, secret: ps.secret === null ? '' : ps.secret, on: ps.on, active: ps.active });
			const updated = await deps.webhooksRepository.findOneByOrFail({ id: ps.webhookId });
			void deps.globalEventService.publishInternalEvent('webhookUpdated', updated);
		});
}
