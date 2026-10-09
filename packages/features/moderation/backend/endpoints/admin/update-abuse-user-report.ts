/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { moderationErrors } from '../../api.errors.js';
export function createAdminUpdateAbuseUserReportProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'abuseUserReportsRepository' | 'abuseReportService'>) {
	return implement(moderationContract.adminUpdateAbuseUserReport, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/update-abuse-user-report', requireCredential: true, requireModerator: true, kind: 'write:admin:resolve-abuse-user-report' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const report = await deps.abuseUserReportsRepository.findOneBy({ id: ps.reportId });
			if (!report) throw apiError(moderationErrors.adminUpdateAbuseUserReport.noSuchAbuseReport);
			await deps.abuseReportService.update(report.id, { moderationNote: ps.moderationNote }, me);
		});
}
