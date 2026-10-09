/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesStateContract, notesStatePolicy } from './state.contract.js';
import type { NotesRepository, NoteThreadMutingsRepository, NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesStateDependencies {
	notesRepository: NotesRepository;
	noteThreadMutingsRepository: NoteThreadMutingsRepository;
	noteFavoritesRepository: NoteFavoritesRepository;
}
export function createNotesStateProcedure(deps: NotesStateDependencies) {
	return implement(notesStateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesStatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesStateContract['~orpc'].outputSchema), await (async () => {
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
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
