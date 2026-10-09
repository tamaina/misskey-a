/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { notesDraftsDeleteContract, notesDraftsDeleteErrors, notesDraftsDeletePolicy } from './delete.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../../command.dependencies.js';
import { getCommandNote } from '../../../get-command-note.js';
import { readErrorId } from '../../../request.schema.js';
export function createNotesDraftsDeleteProcedure(deps: NotesCommandDependencies) {
	return implement(notesDraftsDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesDraftsDeletePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const draft = await deps.getDraft(actor, input.draftId);
			if (draft == null) throw deps.createError(notesDraftsDeleteErrors.noSuchNoteDraft);
			if (draft.userId !== actor.id) {
				throw deps.createError(notesDraftsDeleteErrors.accessDenied);
			}
			await deps.deleteDraft(actor, draft.id);
		});
}
