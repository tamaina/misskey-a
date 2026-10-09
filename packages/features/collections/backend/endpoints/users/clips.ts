/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../api.contract.js';
import type { CollectionsDependencies } from '../../api.dependencies.js';
export interface UsersClipsDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'createQueryBuilder'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'packMany'>;
}
export function createUsersClipsProcedure<Actor extends ApiActor>(deps: UsersClipsDependencies<Actor>) {
	return implement(collectionsContract.usersClips, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.usersClips['~orpc'].meta.requestName })).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.clipsRepository.createQueryBuilder('clip'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('clip.userId = :userId', { userId: ps.userId })
				.andWhere('clip.isPublic = true');
			const clips = await query
				.limit(ps.limit)
				.getMany();
			return await deps.clipEntityService.packMany(clips, me);
		});
}
