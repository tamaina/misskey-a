/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidNotesFavoritesCreateDefinition, voidNotesFavoritesCreateInput, voidNotesFavoritesCreateOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import type { NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { DI } from '@/di-symbols.js';
import { AchievementService } from '@features/users/backend/services/AchievementService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidNotesFavoritesCreateDefinition);

export const meta = {
	tags: ['notes', 'favorites'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:favorites',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '6dd26674-e060-4816-909a-45ba3f4da458',
		},

		alreadyFavorited: {
			message: 'The note has already been marked as a favorite.',
			code: 'ALREADY_FAVORITED',
			id: 'a402c12b-34dd-41d2-97d8-4d2ffd96a1a6',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidNotesFavoritesCreateInput, typeof voidNotesFavoritesCreateOutput> {
	constructor(
		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private idService: IdService,
		private getterService: GetterService,
		private achievementService: AchievementService,
		private noteEntityService: NoteEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Get favoritee
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			// check visibility
			if (!await this.noteEntityService.isVisibleForMe(note, me.id)) {
				throw new ApiError(meta.errors.noSuchNote);
			}

			// if already favorited
			const exist = await this.noteFavoritesRepository.exists({
				where: {
					noteId: note.id,
					userId: me.id,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyFavorited);
			}

			// Create favorite
			await this.noteFavoritesRepository.insert({
				id: this.idService.gen(),
				noteId: note.id,
				userId: me.id,
			});

			if (note.userHost == null && note.userId !== me.id) {
				this.achievementService.create(note.userId, 'myNoteFavorited1');
			}
		});
	}
}
