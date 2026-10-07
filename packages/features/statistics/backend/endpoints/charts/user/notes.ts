/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { chartPerUserNotesDefinition, userChartInput, chartPerUserNotesOutput } from '../../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { PerUserNotesChart } from '../../../charts/per-user-notes.js';

const contractProjection = projectEndpointContract(chartPerUserNotesDefinition);

export const meta = {
	tags: ['charts', 'users', 'notes'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof userChartInput, typeof chartPerUserNotesOutput> {
	constructor(
		private perUserNotesChart: PerUserNotesChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.perUserNotesChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
