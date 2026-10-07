/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { chartActiveUsersDefinition, chartInput, chartActiveUsersOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { ActiveUsersChart } from '../../charts/active-users.js';

const contractProjection = projectEndpointContract(chartActiveUsersDefinition);

export const meta = {
	tags: ['charts', 'users'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof chartInput, typeof chartActiveUsersOutput> {
	constructor(
		private activeUsersChart: ActiveUsersChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.activeUsersChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
