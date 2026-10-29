/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedClip } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
export interface ClipsListDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'createQueryBuilder'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'packMany'>;
}
export function createClipsListProcedure<Actor extends ApiActor>(deps: ClipsListDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.clipsList).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.clipsRepository.createQueryBuilder('clip'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('clip.userId = :userId', { userId: me.id });
			const clips = await query.limit(ps.limit).getMany();
			return (await deps.clipEntityService.packMany(clips, me)).map(toPackedClip);
		});
}
