/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toReportWire } from '../../public-wire.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
export function createAdminAbuseUserReportsProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'queryService' | 'abuseUserReportsRepository' | 'abuseUserReportEntityService'>) {
	return createApiProcedure<Actor>()(moderationContract.adminAbuseUserReports).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'number', sinceDate: 'number', untilDate: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.abuseUserReportsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			switch (ps.state) {
				case 'resolved':
					query.andWhere('report.resolved = TRUE');
					break;
				case 'unresolved':
					query.andWhere('report.resolved = FALSE');
					break;
			}
			switch (ps.reporterOrigin) {
				case 'local':
					query.andWhere('report.reporterHost IS NULL');
					break;
				case 'remote':
					query.andWhere('report.reporterHost IS NOT NULL');
					break;
			}
			switch (ps.targetUserOrigin) {
				case 'local':
					query.andWhere('report.targetUserHost IS NULL');
					break;
				case 'remote':
					query.andWhere('report.targetUserHost IS NOT NULL');
					break;
			}
			const reports = await query.limit(ps.limit).getMany();
			return (await deps.abuseUserReportEntityService.packMany(reports)).map(toReportWire);
		});
}
