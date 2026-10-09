/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesChildrenContract, notesChildrenPolicy, notesChildrenInput, notesChildrenOutput } from './children.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesChildrenProcedure<Actor extends ApiActor>() {
	return implement(notesChildrenContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesChildrenPolicy))
		.handler(({ input, context }) => context.operations.notes.notesChildren(input, context.principal));
}

@Injectable()
export class NotesChildrenOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {}
	async execute(ps: v.InferOutput<typeof notesChildrenInput>, me: MiLocalUser | null): Promise<v.InferOutput<typeof notesChildrenOutput>> {
		return v.parse(notesChildrenOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof notesChildrenInput>, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere(new Brackets(qb => {
				qb
					.where('note.replyId = :noteId', { noteId: ps.noteId })
					.orWhere(new Brackets(qb => {
						qb
							.where('note.renoteId = :noteId', { noteId: ps.noteId })
							.andWhere(new Brackets(qb => {
								qb
									.where('note.text IS NOT NULL')
									.orWhere('note.fileIds != \'{}\'')
									.orWhere('note.hasPoll = TRUE');
							}));
					}));
			}))
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);

		const notes = await query.limit(ps.limit).getMany();

		return await this.noteEntityService.packMany(notes, me);
	}
}
