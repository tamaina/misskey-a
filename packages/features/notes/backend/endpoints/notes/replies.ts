/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesRepliesDefinition, packedNotesRepliesInput, packedNotesRepliesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';

import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedNotesRepliesDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesRepliesInput, typeof packedNotesRepliesOutput> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('note.replyId = :replyId', { replyId: ps.noteId })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBaseNoteFilteringQuery(query, me);

			const timeline = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(timeline, me);
		});
	}
}
