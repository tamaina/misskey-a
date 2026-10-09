/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { promoReadContract, promoReadErrors, promoReadPolicy } from './read.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../command.dependencies.js';
import { getCommandNote } from '../../get-command-note.js';
import { readErrorId } from '../../request.schema.js';
export function createPromoReadProcedure(deps: NotesCommandDependencies) {
	return implement(promoReadContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(promoReadPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, promoReadErrors.noSuchNote);
			if (await deps.promoReadExists(note.id, actor.id)) return;
			await deps.insertPromoRead(deps.newId(), note.id, actor.id);
		});
}
