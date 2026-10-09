/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../../../api.definition.js';
import type { ModerationApiDependencies } from '../../../../api.implementation.js';
export function createAdminAbuseReportNotificationRecipientListProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'abuseReportNotificationService' | 'abuseReportNotificationRecipientEntityService'>) {
	return implement(moderationContract.adminAbuseReportNotificationRecipientList, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/abuse-report/notification-recipient/list', requireCredential: true, requireModerator: true, secure: true, kind: 'read:admin:abuse-report:notification-recipient' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const recipients = await deps.abuseReportNotificationService.fetchRecipients({ method: ps.method });
			return deps.abuseReportNotificationRecipientEntityService.packMany(recipients);
		});
}
