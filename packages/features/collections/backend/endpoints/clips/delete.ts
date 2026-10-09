/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
import { ClipService } from '../../services/ClipService.js';
export interface ClipsDeleteDependencies<Actor extends ApiActor> {
	clipService: Pick<CollectionsDependencies<Actor>['clipService'], 'delete'>;
}
export function createClipsDeleteProcedure<Actor extends ApiActor>(deps: ClipsDeleteDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.clipsDelete).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			try { await deps.clipService.delete(me, ps.clipId); } catch (error) {
				if (error instanceof ClipService.NoSuchClipError) throw apiError(collectionsErrors.clipsDelete.noSuchClip);
				throw error;
			}
		});
}
