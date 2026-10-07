/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartPerUserPvDefinition, userChartInput, chartPerUserPvOutput } from '../../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';

const contractProjection = projectEndpointContract(chartPerUserPvDefinition);

export const meta = {
	tags: ['charts', 'users'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof userChartInput, typeof chartPerUserPvOutput> {
	constructor(
		private perUserPvChart: PerUserPvChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.perUserPvChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
