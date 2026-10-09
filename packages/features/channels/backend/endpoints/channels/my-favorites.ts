/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsMyFavoritesContract, channelsMyFavoritesPolicy } from './my-favorites.contract.js';
import type { ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsMyFavoritesDependencies {
	channelFavoritesRepository: ChannelFavoritesRepository;
	channelEntityService: ChannelEntityService;
}
export function createChannelsMyFavoritesProcedure<Actor extends MiLocalUser>(deps: ChannelsMyFavoritesDependencies) {
	return implement(channelsMyFavoritesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMyFavoritesPolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const query = deps.channelFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.channel', 'channel');

			const favorites = await query
				.getMany();
			return v.parse(v.array(packedChannelSchema), await Promise.all(favorites.map(x => deps.channelEntityService.pack(x.channel!, me))));
		});
}
