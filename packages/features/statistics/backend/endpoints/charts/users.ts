/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { chartUsersDefinition, chartInput, chartUsersOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { UsersChart } from '../../charts/users.js';

const contractProjection = projectEndpointContract(chartUsersDefinition);

export const meta = {
	tags: ['charts', 'users'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof chartInput, typeof chartUsersOutput> {
	constructor(
		private usersChart: UsersChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.usersChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
