/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartInstanceDefinition, instanceChartInput, chartInstanceOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import InstanceChart from '@/core/chart/charts/instance.js';

const contractProjection = projectEndpointContract(chartInstanceDefinition);

export const meta = {
	tags: ['charts'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof instanceChartInput, typeof chartInstanceOutput> {
	constructor(
		private instanceChart: InstanceChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.instanceChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.host);
		});
	}
}
