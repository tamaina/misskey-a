/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineNotesShowPartialBulkDefinition, inlineNotesShowPartialBulkInput, inlineNotesShowPartialBulkOutput } from '../../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(inlineNotesShowPartialBulkDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineNotesShowPartialBulkInput, typeof inlineNotesShowPartialBulkOutput> {
	constructor(
		private noteEntityService: NoteEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.noteEntityService.fetchDiffs(ps.noteIds, me?.id ?? null);
		});
	}
}
