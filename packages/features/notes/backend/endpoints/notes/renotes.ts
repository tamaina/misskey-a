/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesRenotesContract, notesRenotesPolicy, notesRenotesInput, notesRenotesOutput, notesRenotesErrors } from './renotes.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesRenotesProcedure<Actor extends ApiActor>() {
	return implement(notesRenotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesRenotesPolicy))
		.handler(({ input, context }) => context.operations.notes.notesRenotes(input, context.principal));
}

@Injectable()
export class NotesRenotesOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private getterService: GetterService,
	) {}
	async execute(ps: v.InferOutput<typeof notesRenotesInput>, me: MiLocalUser | null): Promise<v.InferOutput<typeof notesRenotesOutput>> {
		return v.parse(notesRenotesOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof notesRenotesInput>, me: MiLocalUser | null) {
		const note = await this.getterService.getNote(ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesRenotesErrors.noSuchNote);
			throw err;
		});

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('note.renoteId = :renoteId', { renoteId: note.id })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);

		const renotes = await query.limit(ps.limit).getMany();

		return await this.noteEntityService.packMany(renotes, me);
	}
}
