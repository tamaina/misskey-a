/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { notesReactionsDeleteContract, notesReactionsDeletePolicy } from './delete.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../../operations.js';

export function createNotesReactionsDeleteProcedure<Actor extends ApiActor>() {
	return implement(notesReactionsDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesReactionsDeletePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesReactionsDelete(input, context.principal));
}
