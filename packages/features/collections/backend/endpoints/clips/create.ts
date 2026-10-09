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
import type { MiClip } from '@features/persistence/backend/repositories/models.js';
export interface ClipsCreateDependencies<Actor extends ApiActor> {
	clipService: Pick<CollectionsDependencies<Actor>['clipService'], 'create'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'pack'>;
}
export function createClipsCreateProcedure<Actor extends ApiActor>(deps: ClipsCreateDependencies<Actor>) {
	return implement(collectionsContract.clipsCreate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsCreate['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			let clip: MiClip;
			try {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				clip = await deps.clipService.create(me, ps.name, ps.isPublic, ps.description || null);
			} catch (e) {
				if (e instanceof ClipService.TooManyClipsError) {
					throw apiError(collectionsErrors.clipsCreate.tooManyClips);
				}
				throw e;
			}
			return await deps.clipEntityService.pack(clip, me);
		});
}
