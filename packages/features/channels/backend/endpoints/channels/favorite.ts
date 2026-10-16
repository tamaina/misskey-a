/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { channelsFavoriteContract, channelsFavoriteErrors } from './favorite.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository, ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import { type IdService } from '@features/runtime/backend/services/IdService.js';
export interface ChannelsFavoriteDependencies {
	channelsRepository: ChannelsRepository;
	channelFavoritesRepository: ChannelFavoritesRepository;
	idService: IdService;
}
export function createChannelsFavoriteProcedure<Actor extends MiLocalUser>(deps: ChannelsFavoriteDependencies) {
	return createApiProcedure<Actor>()(channelsFavoriteContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsFavoriteErrors.noSuchChannel);
			await deps.channelFavoritesRepository.insert({
				id: deps.idService.gen(),
				userId: actor.id,
				channelId: channel.id,
			});
		});
}
