/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { notesPilotContract } from './endpoints/notes/delete.contract.js';
import { createDeleteProcedure } from './endpoints/notes/delete.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';

export function createNotesRouter<Actor extends ApiActor>() {
	return implement(notesPilotContract).$context<ApiContext<Actor>>().router({ delete: createDeleteProcedure<Actor>() });
}
