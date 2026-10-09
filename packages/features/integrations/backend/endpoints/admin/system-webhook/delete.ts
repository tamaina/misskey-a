/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { adminSystemWebhookDeleteContract } from './delete.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
export interface AdminSystemWebhookDeleteDependencies {
	systemWebhookService: Pick<SystemWebhookService, 'deleteSystemWebhook'>;
}
export function createAdminSystemWebhookDeleteProcedure(deps: AdminSystemWebhookDeleteDependencies) {
	return createApiProcedure<MiLocalUser>()(adminSystemWebhookDeleteContract)
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
			return result;
		});
}
