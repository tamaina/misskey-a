/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookDeleteContract } from './delete.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
export interface AdminSystemWebhookDeleteDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'deleteSystemWebhook'>;
}
export function createAdminSystemWebhookDeleteProcedure(deps: AdminSystemWebhookDeleteDependencies) {
	return implement(adminSystemWebhookDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: 'admin/system-webhook/delete', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:system-webhook' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				await deps.systemWebhookService.deleteSystemWebhook(
					ps.id,
					me,
				);
			})();
			return v.parse(requiredSchema(adminSystemWebhookDeleteContract['~orpc'].outputSchema), result);
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
