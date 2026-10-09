/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
import { ClipService } from '../../services/ClipService.js';
export interface ClipsUpdateDependencies<Actor extends ApiActor> {
	clipService: Pick<CollectionsDependencies<Actor>['clipService'], 'update'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'pack'>;
}
export function createClipsUpdateProcedure<Actor extends ApiActor>(deps: ClipsUpdateDependencies<Actor>) {
	return implement(collectionsContract.clipsUpdate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsUpdate['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			try {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				await deps.clipService.update(me, ps.clipId, ps.name, ps.isPublic, ps.description || null);
			} catch (e) {
				if (e instanceof ClipService.NoSuchClipError) {
					throw apiError(collectionsErrors.clipsUpdate.noSuchClip);
				}
				throw e;
			}
			return await deps.clipEntityService.pack(ps.clipId, me);
		});
}
