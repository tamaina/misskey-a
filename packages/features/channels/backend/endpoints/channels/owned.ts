/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type QueryService } from '@features/notes/backend/services/QueryService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsOwnedContract } from './owned.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsOwnedDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
	queryService: QueryService;
}
export function createChannelsOwnedProcedure<Actor extends MiLocalUser>(deps: ChannelsOwnedDependencies) {
	return createApiProcedure<Actor>()(channelsOwnedContract)
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
			return (await Promise.all(channels.map(x => deps.channelEntityService.pack(x, me)))).map(toPackedChannel);
		});
}
