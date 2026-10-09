/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesPilotContract } from './delete.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';

export function createDeleteProcedure<Actor extends ApiActor>() {
	const notes = implement(notesPilotContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'notes/delete', requireCredential: true, kind: 'write:notes', limit: {
			key: 'notes/delete', duration: 3600000, max: 300, minInterval: 1000,
		} }))
		.use(requirePrincipal<Actor>());
	return notes.delete.handler(({ input, context }) => context.services.deleteNote(input.noteId, context.principal));
}
