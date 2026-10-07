/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartDriveDefinition, chartInput, chartDriveOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import DriveChart from '@/core/chart/charts/drive.js';

const contractProjection = projectEndpointContract(chartDriveDefinition);

export const meta = {
	tags: ['charts', 'drive'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof chartInput, typeof chartDriveOutput> {
	constructor(
		private driveChart: DriveChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.driveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
