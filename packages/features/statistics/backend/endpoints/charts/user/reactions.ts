/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartPerUserReactionsDefinition, userChartInput, chartPerUserReactionsOutput } from '../../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';

const contractProjection = projectEndpointContract(chartPerUserReactionsDefinition);

export const meta = {
	tags: ['charts', 'users', 'reactions'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof userChartInput, typeof chartPerUserReactionsOutput> {
	constructor(
		private perUserReactionsChart: PerUserReactionsChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.perUserReactionsChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
