/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { usersNotesContract } from './notes.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { TimelinesContext } from '../../operations.js';

export function createUsersNotesProcedure<Actor extends ApiActor>() {
	return implement(usersNotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<TimelinesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'users/notes' }))
		.handler(({ input, context }) => context.operations.timelines.usersNotes(input, context.principal));
}
