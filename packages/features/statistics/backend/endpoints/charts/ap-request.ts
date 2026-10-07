/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartApRequestDefinition, chartInput, chartApRequestOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { ApRequestChart } from '../../charts/ap-request.js';

const contractProjection = projectEndpointContract(chartApRequestDefinition);

export const meta = {
	tags: ['charts'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof chartInput, typeof chartApRequestOutput> {
	constructor(
		private apRequestChart: ApRequestChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.apRequestChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
