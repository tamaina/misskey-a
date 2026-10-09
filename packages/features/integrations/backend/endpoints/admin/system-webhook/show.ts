/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookShowErrors, adminSystemWebhookShowContract } from './show.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
export interface AdminSystemWebhookShowDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'fetchSystemWebhooks'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'pack'>;
}
export function createAdminSystemWebhookShowProcedure(deps: AdminSystemWebhookShowDependencies) {
	return implement(adminSystemWebhookShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: 'admin/system-webhook/show', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:system-webhook' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				const webhooks = await deps.systemWebhookService.fetchSystemWebhooks({ ids: [ps.id] });
				if (webhooks.length === 0) {
					throw apiError(adminSystemWebhookShowErrors.noSuchSystemWebhook);
				}
				return deps.systemWebhookEntityService.pack(webhooks[0]);
			})();
			return v.parse(requiredSchema(adminSystemWebhookShowContract['~orpc'].outputSchema), result);
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
