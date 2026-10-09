/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesStateContract } from './state.contract.js';
import type { NotesRepository, NoteThreadMutingsRepository, NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesStateDependencies {
	notesRepository: NotesRepository;
	noteThreadMutingsRepository: NoteThreadMutingsRepository;
	noteFavoritesRepository: NoteFavoritesRepository;
}
export function createNotesStateProcedure(deps: NotesStateDependencies) {
	return createApiProcedure<MiLocalUser>()(notesStateContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const note = await deps.notesRepository.findOneByOrFail({ id: ps.noteId });

					const [favorite, threadMuting] = await Promise.all([
						deps.noteFavoritesRepository.count({
							where: {
								userId: me.id,
								noteId: note.id,
							},
							take: 1,
						}),
						deps.noteThreadMutingsRepository.count({
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
			})();
			return { isFavorited: result.isFavorited, isMutedThread: result.isMutedThread };
		});
}
