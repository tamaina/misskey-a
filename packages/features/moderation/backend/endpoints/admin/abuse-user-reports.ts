/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminAbuseUserReportsDefinition, packedAdminAbuseUserReportsInput, packedAdminAbuseUserReportsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AbuseUserReportsRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { AbuseUserReportEntityService } from '../../serializers/AbuseUserReportEntityService.js';

const contractProjection = projectEndpointContract(packedAdminAbuseUserReportsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:abuse-user-reports',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminAbuseUserReportsInput, typeof packedAdminAbuseUserReportsOutput> {
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private abuseUserReportEntityService: AbuseUserReportEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.abuseUserReportsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			switch (ps.state) {
				case 'resolved': query.andWhere('report.resolved = TRUE'); break;
				case 'unresolved': query.andWhere('report.resolved = FALSE'); break;
			}

			switch (ps.reporterOrigin) {
				case 'local': query.andWhere('report.reporterHost IS NULL'); break;
				case 'remote': query.andWhere('report.reporterHost IS NOT NULL'); break;
			}

			switch (ps.targetUserOrigin) {
				case 'local': query.andWhere('report.targetUserHost IS NULL'); break;
				case 'remote': query.andWhere('report.targetUserHost IS NOT NULL'); break;
			}

			const reports = await query.limit(ps.limit).getMany();

			return await this.abuseUserReportEntityService.packMany(reports);
		});
	}
}
