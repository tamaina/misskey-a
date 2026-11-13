/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toRecipientWire } from '../../../../public-wire.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../../../api.definition.js';
import type { ModerationApiDependencies } from '../../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { moderationErrors } from '../../../../api.errors.js';
export function createAdminAbuseReportNotificationRecipientShowProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'abuseReportNotificationService' | 'abuseReportNotificationRecipientEntityService'>) {
	return createApiProcedure<Actor>()(moderationContract.adminAbuseReportNotificationRecipientShow).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const recipients = await deps.abuseReportNotificationService.fetchRecipients({ ids: [ps.id] });
			if (recipients.length === 0) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientShow.noSuchRecipient);
			}
			return toRecipientWire(await deps.abuseReportNotificationRecipientEntityService.pack(recipients[0]));
		});
}
