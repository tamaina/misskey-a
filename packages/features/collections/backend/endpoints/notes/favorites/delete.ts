/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidNotesFavoritesDeleteDefinition, voidNotesFavoritesDeleteInput, voidNotesFavoritesDeleteOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { DI } from '@/di-symbols.js';
import type { NoteFavoritesRepository } from '@/models/_.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidNotesFavoritesDeleteDefinition);

export const meta = {
	tags: ['notes', 'favorites'],

	requireCredential: true,

	kind: 'write:favorites',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '80848a2c-398f-4343-baa9-df1d57696c56',
		},

		notFavorited: {
			message: 'You have not marked that note a favorite.',
			code: 'NOT_FAVORITED',
			id: 'b625fc69-635e-45e9-86f4-dbefbef35af5',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidNotesFavoritesDeleteInput, typeof voidNotesFavoritesDeleteOutput> {
	constructor(
		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private getterService: GetterService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Get favoritee
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			// if already favorited
			const exist = await this.noteFavoritesRepository.findOneBy({
				noteId: note.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(meta.errors.notFavorited);
			}

			// Delete favorite
			await this.noteFavoritesRepository.delete(exist.id);
		});
	}
}
