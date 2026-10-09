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
import { channelsOwnedContract, channelsOwnedPolicy } from './owned.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsOwnedDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
	queryService: QueryService;
}
export function createChannelsOwnedProcedure<Actor extends MiLocalUser>(deps: ChannelsOwnedDependencies) {
	return implement(channelsOwnedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsOwnedPolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.channelsRepository.createQueryBuilder('channel'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('channel.isArchived = FALSE')
				.andWhere({ userId: me.id });

			const channels = await query
				.limit(ps.limit)
				.getMany();
			return v.parse(v.array(packedChannelSchema), await Promise.all(channels.map(x => deps.channelEntityService.pack(x, me))));
		});
}
