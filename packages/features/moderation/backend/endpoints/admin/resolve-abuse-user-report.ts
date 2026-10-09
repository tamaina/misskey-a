/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { moderationContract } from '../../api.contract.js';
import type { ModerationApiDependencies } from '../../api.dependencies.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { moderationErrors } from '../../api.errors.js';
export function createAdminResolveAbuseUserReportProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'abuseUserReportsRepository' | 'abuseReportService'>) {
	return implement(moderationContract.adminResolveAbuseUserReport, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/resolve-abuse-user-report', requireCredential: true, requireModerator: true, kind: 'write:admin:resolve-abuse-user-report' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const report = await deps.abuseUserReportsRepository.findOneBy({ id: ps.reportId });
			if (!report) throw apiError(moderationErrors.adminResolveAbuseUserReport.noSuchAbuseReport);
			await deps.abuseReportService.resolve([{ reportId: report.id, resolvedAs: ps.resolvedAs ?? null }], me);
		});
}
