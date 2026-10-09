/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../../api/backend/transport/middleware.js';
import { moderationContract } from '../../../../api.contract.js';
import type { ModerationApiDependencies } from '../../../../api.dependencies.js';
export function createAdminAbuseReportNotificationRecipientDeleteProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'abuseReportNotificationService'>) {
	return implement(moderationContract.adminAbuseReportNotificationRecipientDelete, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/abuse-report/notification-recipient/delete', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:abuse-report:notification-recipient' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			await deps.abuseReportNotificationService.deleteRecipient(ps.id, me);
		});
}
