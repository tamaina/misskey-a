/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsMyFavoritesContract } from './my-favorites.contract.js';
import type { ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsMyFavoritesDependencies {
	channelFavoritesRepository: ChannelFavoritesRepository;
	channelEntityService: ChannelEntityService;
}
export function createChannelsMyFavoritesProcedure<Actor extends MiLocalUser>(deps: ChannelsMyFavoritesDependencies) {
	return createApiProcedure<Actor>()(channelsMyFavoritesContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const query = deps.channelFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.channel', 'channel');

			const favorites = await query
				.getMany();
			return (await Promise.all(favorites.map(x => deps.channelEntityService.pack(x.channel!, me)))).map(toPackedChannel);
		});
}
