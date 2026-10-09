/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../../../api.definition.js';
import type { ModerationApiDependencies } from '../../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { moderationErrors } from '../../../../api.errors.js';
export function createAdminAbuseReportNotificationRecipientCreateProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'userProfilesRepository' | 'abuseReportNotificationService' | 'abuseReportNotificationRecipientEntityService'>) {
	return implement(moderationContract.adminAbuseReportNotificationRecipientCreate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/abuse-report/notification-recipient/create', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:abuse-report:notification-recipient' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isActive: 'boolean' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			if (ps.method === 'email') {
				const userProfile = await deps.userProfilesRepository.findOneBy({ userId: ps.userId });
				if (!ps.userId || !userProfile) {
					throw apiError(moderationErrors.adminAbuseReportNotificationRecipientCreate.correlationCheckEmail);
				}
				if (!userProfile.email || !userProfile.emailVerified) {
					throw apiError(moderationErrors.adminAbuseReportNotificationRecipientCreate.emailAddressNotSet);
				}
			}
			if (ps.method === 'webhook' && !ps.systemWebhookId) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientCreate.correlationCheckWebhook);
			}
			const userId = ps.method === 'email' ? ps.userId : null;
			const systemWebhookId = ps.method === 'webhook' ? ps.systemWebhookId : null;
			const result = await deps.abuseReportNotificationService.createRecipient({
				isActive: ps.isActive,
				name: ps.name,
				method: ps.method,
				userId: userId ?? null,
				systemWebhookId: systemWebhookId ?? null,
			}, me);
			return deps.abuseReportNotificationRecipientEntityService.pack(result);
		});
}
