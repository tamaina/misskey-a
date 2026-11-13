/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toRecipientWire } from '../../../../public-wire.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../../../api.definition.js';
import type { ModerationApiDependencies } from '../../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { moderationErrors } from '../../../../api.errors.js';
export function createAdminAbuseReportNotificationRecipientUpdateProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'userProfilesRepository' | 'abuseReportNotificationService' | 'abuseReportNotificationRecipientEntityService'>) {
	return createApiProcedure<Actor>()(moderationContract.adminAbuseReportNotificationRecipientUpdate).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isActive: 'boolean' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			if (ps.method === 'email') {
				const userProfile = await deps.userProfilesRepository.findOneBy({ userId: ps.userId });
				if (!ps.userId || !userProfile) {
					throw apiError(moderationErrors.adminAbuseReportNotificationRecipientUpdate.correlationCheckEmail);
				}
				if (!userProfile.email || !userProfile.emailVerified) {
					throw apiError(moderationErrors.adminAbuseReportNotificationRecipientUpdate.emailAddressNotSet);
				}
			}
			if (ps.method === 'webhook' && !ps.systemWebhookId) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientUpdate.correlationCheckWebhook);
			}
			const userId = ps.method === 'email' ? ps.userId : null;
			const systemWebhookId = ps.method === 'webhook' ? ps.systemWebhookId : null;
			const result = await deps.abuseReportNotificationService.updateRecipient({
				id: ps.id,
				isActive: ps.isActive,
				name: ps.name,
				method: ps.method,
				userId: userId ?? null,
				systemWebhookId: systemWebhookId ?? null,
			}, me);
			return toRecipientWire(await deps.abuseReportNotificationRecipientEntityService.pack(result));
		});
}
