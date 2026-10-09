/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IdService } from '../../../../../runtime/backend/services/IdService.js';
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { RoleService } from '../../../../../roles/backend/services/RoleService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { iWebhooksCreateErrors, iWebhooksCreateContract } from './create.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface IWebhooksCreateDependencies {
	webhooksRepository: WebhooksRepository;
	idService: Pick<IdService, 'gen'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}
export function createIWebhooksCreateProcedure(deps: IWebhooksCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(iWebhooksCreateContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const currentWebhooksCount = await deps.webhooksRepository.countBy({
					userId: me.id,
				});
				if (currentWebhooksCount >= (await deps.roleService.getUserPolicies(me.id)).webhookLimit) {
					throw apiError(iWebhooksCreateErrors.tooManyWebhooks);
				}
				const webhook = await deps.webhooksRepository.insertOne({
					id: deps.idService.gen(),
					userId: me.id,
					name: ps.name,
					url: ps.url,
					secret: ps.secret,
					on: ps.on,
				});
				deps.globalEventService.publishInternalEvent('webhookCreated', webhook);
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
