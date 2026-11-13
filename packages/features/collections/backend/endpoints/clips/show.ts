/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedClip } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
export interface ClipsShowDependencies<Actor extends ApiActor> {
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'findOneBy'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'pack'>;
}
export function createClipsShowProcedure<Actor extends ApiActor>(deps: ClipsShowDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.clipsShow)
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			// Fetch the clip
			const clip = await deps.clipsRepository.findOneBy({
				id: ps.clipId,
			});
			if (clip == null) {
				throw apiError(collectionsErrors.clipsShow.noSuchClip);
			}
			if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
				throw apiError(collectionsErrors.clipsShow.noSuchClip);
			}
			return toPackedClip(await deps.clipEntityService.pack(clip, me));
		});
}
