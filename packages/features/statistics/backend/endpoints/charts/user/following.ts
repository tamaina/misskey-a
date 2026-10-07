/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { chartPerUserFollowingDefinition, userChartInput, chartPerUserFollowingOutput } from '../../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { PerUserFollowingChart } from '../../../charts/per-user-following.js';

const contractProjection = projectEndpointContract(chartPerUserFollowingDefinition);

export const meta = {
	tags: ['charts', 'users', 'following'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof userChartInput, typeof chartPerUserFollowingOutput> {
	constructor(
		private perUserFollowingChart: PerUserFollowingChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.perUserFollowingChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
