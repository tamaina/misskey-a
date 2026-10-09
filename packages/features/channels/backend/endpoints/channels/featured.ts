/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsFeaturedContract, channelsFeaturedPolicy } from './featured.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsFeaturedDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
}
export function createChannelsFeaturedProcedure<Actor extends MiLocalUser>(deps: ChannelsFeaturedDependencies) {
	return implement(channelsFeaturedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsFeaturedPolicy))
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const query = deps.channelsRepository.createQueryBuilder('channel')
				.where('channel.lastNotedAt IS NOT NULL')
				.andWhere('channel.isArchived = FALSE')
				.orderBy('channel.lastNotedAt', 'DESC');

			const channels = await query.limit(10).getMany();
			return v.parse(v.array(packedChannelSchema), await Promise.all(channels.map(x => deps.channelEntityService.pack(x, me))));
		});
}
