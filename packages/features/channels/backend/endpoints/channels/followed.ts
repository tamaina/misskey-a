/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsFollowedContract, channelsFollowedPolicy } from './followed.contract.js';
import type { ChannelFollowingsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsFollowedDependencies {
	channelFollowingsRepository: ChannelFollowingsRepository;
	channelEntityService: ChannelEntityService;
	queryService: QueryService;
}
export function createChannelsFollowedProcedure<Actor extends MiLocalUser>(deps: ChannelsFollowedDependencies) {
	return implement(channelsFollowedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsFollowedPolicy))
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
			return v.parse(v.array(packedChannelSchema), await Promise.all(followings.map(x => deps.channelEntityService.pack(x.followeeId, me))));
		});
}
