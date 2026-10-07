/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesConversationDefinition, packedNotesConversationInput, packedNotesConversationOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { MiNote } from '../../models/Note.js';
import type { MiMeta, NotesRepository } from '@/models/_.js';

import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedNotesConversationDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'e1035875-9551-45ec-afa8-1ded1fcb53c8',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesConversationInput, typeof packedNotesConversationOutput> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (me == null && this.serverSettings.ugcVisibilityForVisitor === 'none') return [];

			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			const conversation: MiNote[] = [];
			let i = 0;

			const get = async (id: any) => {
				i++;
				const p = await this.notesRepository.findOneBy({ id });
				if (p == null) return;

				if (i > ps.offset!) {
					conversation.push(p);
				}

				if (conversation.length === ps.limit) {
					return;
				}

				if (p.replyId) {
					await get(p.replyId);
				}
			};

			if (note.replyId) {
				await get(note.replyId);
			}

			return await this.noteEntityService.packMany(conversation, me);
		});
	}
}
