/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { channelsUnfavoriteContract, channelsUnfavoriteErrors } from './unfavorite.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository, ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
export interface ChannelsUnfavoriteDependencies {
	channelsRepository: ChannelsRepository;
	channelFavoritesRepository: ChannelFavoritesRepository;
}
export function createChannelsUnfavoriteProcedure<Actor extends MiLocalUser>(deps: ChannelsUnfavoriteDependencies) {
	return createApiProcedure<Actor>()(channelsUnfavoriteContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsUnfavoriteErrors.noSuchChannel);
			await deps.channelFavoritesRepository.delete({ userId: actor.id, channelId: channel.id });
		});
}
