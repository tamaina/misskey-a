/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAdminShowModerationLogsDefinition, packedAdminShowModerationLogsInput, packedAdminShowModerationLogsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ModerationLogsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogEntityService } from '../../serializers/ModerationLogEntityService.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

const contractProjection = projectEndpointContract(packedAdminShowModerationLogsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:show-moderation-log',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminShowModerationLogsInput, typeof packedAdminShowModerationLogsOutput> {
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private moderationLogEntityService: ModerationLogEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.moderationLogsRepository.createQueryBuilder('log'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			if (ps.type != null) {
				query.andWhere('log.type = :type', { type: ps.type });
			}

			if (ps.userId != null) {
				query.andWhere('log.userId = :userId', { userId: ps.userId });
			}

			if (ps.search != null) {
				const escapedSearch = sqlLikeEscape(ps.search);
				query.andWhere('log.info::text ILIKE :search', { search: `%${escapedSearch}%` });
			}

			const logs = await query.limit(ps.limit).getMany();

			return await this.moderationLogEntityService.packMany(logs);
		});
	}
}
