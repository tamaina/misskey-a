/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesStateContract, notesStatePolicy, notesStateInput, notesStateOutput } from './state.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { NotesRepository, NoteThreadMutingsRepository, NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesStateProcedure<Actor extends ApiActor>() {
	return implement(notesStateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesStatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesState(input, context.principal));
}

@Injectable()
export class NotesStateOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,
	) {}
	async execute(ps: v.InferOutput<typeof notesStateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof notesStateOutput>> {
		return v.parse(notesStateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof notesStateInput>, me: MiLocalUser) {
		const note = await this.notesRepository.findOneByOrFail({ id: ps.noteId });

		const [favorite, threadMuting] = await Promise.all([
			this.noteFavoritesRepository.count({
				where: {
					userId: me.id,
					noteId: note.id,
				},
				take: 1,
			}),
			this.noteThreadMutingsRepository.count({
				where: {
					userId: me.id,
					threadId: note.threadId ?? note.id,
				},
				take: 1,
			}),
		]);

		return {
			isFavorited: favorite !== 0,
			isMutedThread: threadMuting !== 0,
		};
	}
}
