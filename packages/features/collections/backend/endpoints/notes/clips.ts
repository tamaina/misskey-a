/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesClipsDefinition, packedNotesClipsInput, packedNotesClipsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { ClipNotesRepository, ClipsRepository } from '@/models/_.js';

import { ClipEntityService } from '../../serializers/ClipEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedNotesClipsDefinition);

export const meta = {
	tags: ['clips', 'notes'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '47db1a1c-b0af-458d-8fb4-986e4efafe1e',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesClipsInput, typeof packedNotesClipsOutput> {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private clipEntityService: ClipEntityService,
		private getterService: GetterService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			const clipNotes = await this.clipNotesRepository.findBy({
				noteId: note.id,
			});

			const clips = await this.clipsRepository.findBy({
				id: In(clipNotes.map(x => x.clipId)),
				isPublic: true,
			});

			return await this.clipEntityService.packMany(clips, me);
		});
	}
}
