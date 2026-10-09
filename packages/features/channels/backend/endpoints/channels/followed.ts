/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type QueryService } from '@features/notes/backend/services/QueryService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsFollowedContract } from './followed.contract.js';
import type { ChannelFollowingsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsFollowedDependencies {
	channelFollowingsRepository: ChannelFollowingsRepository;
	channelEntityService: ChannelEntityService;
	queryService: QueryService;
}
export function createChannelsFollowedProcedure<Actor extends MiLocalUser>(deps: ChannelsFollowedDependencies) {
	return createApiProcedure<Actor>()(channelsFollowedContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService
				.makePaginationQuery(
					deps.channelFollowingsRepository.createQueryBuilder(),
					ps.sinceId,
					ps.untilId,
					ps.sinceDate,
					ps.untilDate,
					'followeeId',
				)
				.andWhere({ followerId: me.id });

			const followings = await query
				.limit(ps.limit)
				.getMany();
			return (await Promise.all(followings.map(x => deps.channelEntityService.pack(x.followeeId, me)))).map(toPackedChannel);
		});
}
