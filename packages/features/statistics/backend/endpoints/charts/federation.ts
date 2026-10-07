/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartFederationDefinition, chartInput, chartFederationOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import FederationChart from '@/core/chart/charts/federation.js';

const contractProjection = projectEndpointContract(chartFederationDefinition);

export const meta = {
	tags: ['charts'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof chartInput, typeof chartFederationOutput> {
	constructor(
		private federationChart: FederationChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.federationChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
