/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../../../api.definition.js';
import type { ModerationApiDependencies } from '../../../../api.implementation.js';
export function createAdminAbuseReportNotificationRecipientDeleteProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'abuseReportNotificationService'>) {
	return createApiProcedure<Actor>()(moderationContract.adminAbuseReportNotificationRecipientDelete).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			await deps.abuseReportNotificationService.deleteRecipient(ps.id, me);
		});
}
