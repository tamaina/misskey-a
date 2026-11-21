/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { promoReadContract, promoReadErrors } from './read.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../command.dependencies.js';
import { getCommandNote } from '../../get-command-note.js';
import { readErrorId } from '../../request.schema.js';
export function createPromoReadProcedure(deps: NotesCommandDependencies) {
	return createApiProcedure<MiLocalUser>()(promoReadContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, promoReadErrors.noSuchNote);
			if (await deps.promoReadExists(note.id, actor.id)) return;
			await deps.insertPromoRead(deps.newId(), note.id, actor.id);
		});
}
