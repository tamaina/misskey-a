/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { notesPilotContract } from './delete.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, writePolicy } from '../../../../api/backend/transport/middleware.js';

export function createDeleteProcedure<Actor extends ApiActor>() {
	const notes = implement(notesPilotContract).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(writePolicy<Actor>('write:notes', {
			key: 'notes/delete', duration: 3600000, max: 300, minInterval: 1000,
		}));
	return notes.delete.handler(({ input, context }) => context.services.deleteNote(input.noteId, context.principal));
}
