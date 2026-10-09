/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { notesReactionsDeleteContract, notesReactionsDeleteErrors, notesReactionsDeletePolicy } from './delete.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../../command.dependencies.js';
import { getCommandNote } from '../../../get-command-note.js';
import { readErrorId } from '../../../request.schema.js';
export function createNotesReactionsDeleteProcedure(deps: NotesCommandDependencies) {
	return implement(notesReactionsDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesReactionsDeletePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, notesReactionsDeleteErrors.noSuchNote);
			try {
				await deps.deleteReaction(actor, note);
			} catch (error) {
				if (readErrorId(error) === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') {
					throw deps.createError(notesReactionsDeleteErrors.notReacted);
				}
				throw error;
			}
		});
}
