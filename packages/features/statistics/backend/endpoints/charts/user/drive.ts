/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartPerUserDriveDefinition, userChartInput, chartPerUserDriveOutput } from '../../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { PerUserDriveChart } from '../../../charts/per-user-drive.js';

const contractProjection = projectEndpointContract(chartPerUserDriveDefinition);

export const meta = {
	tags: ['charts', 'drive', 'users'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof userChartInput, typeof chartPerUserDriveOutput> {
	constructor(
		private perUserDriveChart: PerUserDriveChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.perUserDriveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
