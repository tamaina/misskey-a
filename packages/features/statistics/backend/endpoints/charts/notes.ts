/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { chartNotesDefinition, chartInput, chartNotesOutput } from '../../../contract/chart-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import NotesChart from '@/core/chart/charts/notes.js';

const contractProjection = projectEndpointContract(chartNotesDefinition);

export const meta = {
	tags: ['charts', 'notes'],

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof chartInput, typeof chartNotesOutput> {
	constructor(
		private notesChart: NotesChart,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.notesChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
