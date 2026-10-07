/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAntennasRemoveNoteDefinition, voidAntennasRemoveNoteInput, voidAntennasRemoveNoteOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AntennasRepository } from '@/models/_.js';
import { FanoutTimelineService } from '../../services/FanoutTimelineService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidAntennasRemoveNoteDefinition);

export const meta = {
	tags: ['antennas', 'account', 'notes'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '850926e0-fd3b-49b6-b69a-b28a5dbd82fe',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAntennasRemoveNoteInput, typeof voidAntennasRemoveNoteOutput> {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private fanoutTimelineService: FanoutTimelineService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const antenna = await this.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});

			if (antenna == null) {
				throw new ApiError(meta.errors.noSuchAntenna);
			}

			await this.fanoutTimelineService.remove(`antennaTimeline:${antenna.id}`, ps.noteId);
		});
	}
}
