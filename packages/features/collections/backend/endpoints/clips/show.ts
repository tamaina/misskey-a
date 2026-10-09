/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
export interface ClipsShowDependencies<Actor extends ApiActor> {
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'findOneBy'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'pack'>;
}
export function createClipsShowProcedure<Actor extends ApiActor>(deps: ClipsShowDependencies<Actor>) {
	return implement(collectionsContract.clipsShow, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsShow['~orpc'].meta.requestName, kind: 'read:account' }))
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
			return await deps.clipEntityService.pack(clip, me);
		});
}
