/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedISigninHistoryDefinition, packedISigninHistoryInput, packedISigninHistoryOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { SigninsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { SigninEntityService } from '../../serializers/SigninEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedISigninHistoryDefinition);

export const meta = {
	requireCredential: true,
	secure: true,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedISigninHistoryInput, typeof packedISigninHistoryOutput> {
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private signinEntityService: SigninEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.signinsRepository.createQueryBuilder('signin'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('signin.userId = :meId', { meId: me.id });

			const history = await query.limit(ps.limit).getMany();

			return await Promise.all(history.map(record => this.signinEntityService.pack(record)));
		});
	}
}
