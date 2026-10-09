/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { iWebhooksDeleteErrors, iWebhooksDeleteContract } from './delete.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
export interface IWebhooksDeleteDependencies {
	webhooksRepository: WebhooksRepository;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
export function createIWebhooksDeleteProcedure(deps: IWebhooksDeleteDependencies) {
	return implement(iWebhooksDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: 'i/webhooks/delete', requireCredential: true, kind: 'write:account' }))
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

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
