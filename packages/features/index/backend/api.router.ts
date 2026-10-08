/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { pilotContract } from './api.contract.js';
import { createInstanceRouter } from '../../instance/backend/api.router.js';
import { createNotesRouter } from '../../notes/backend/api.router.js';
import { createDriveRouter } from '../../drive/backend/api.router.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { normalizeError } from '../../api/backend/transport/orpc-error.js';

export function createApiRouter<Actor extends ApiActor>() {
	const api = implement(pilotContract).$context<ApiContext<Actor>>()
		.use(async ({ context, next }) => {
			try { return await next(); } catch (error) { throw context.mapError ? context.mapError(error) : normalizeError(error); }
		});
	return api.router({
		instance: createInstanceRouter<Actor>(),
		notes: createNotesRouter<Actor>(),
		drive: createDriveRouter<Actor>(),
	});
}
