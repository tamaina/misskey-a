/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsFeaturedContract } from './featured.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsFeaturedDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
}
export function createChannelsFeaturedProcedure<Actor extends MiLocalUser>(deps: ChannelsFeaturedDependencies) {
	return createApiProcedure<Actor>()(channelsFeaturedContract)
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const query = deps.channelsRepository.createQueryBuilder('channel')
				.where('channel.lastNotedAt IS NOT NULL')
				.andWhere('channel.isArchived = FALSE')
				.orderBy('channel.lastNotedAt', 'DESC');

			const channels = await query.limit(10).getMany();
			return (await Promise.all(channels.map(x => deps.channelEntityService.pack(x, me)))).map(toPackedChannel);
		});
}
