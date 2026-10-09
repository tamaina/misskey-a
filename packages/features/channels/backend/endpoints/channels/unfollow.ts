/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { channelsUnfollowContract, channelsUnfollowErrors } from './unfollow.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { type ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
export interface ChannelsUnfollowDependencies {
	channelsRepository: ChannelsRepository;
	channelFollowingService: ChannelFollowingService;
}
export function createChannelsUnfollowProcedure<Actor extends MiLocalUser>(deps: ChannelsUnfollowDependencies) {
	return createApiProcedure<Actor>()(channelsUnfollowContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsUnfollowErrors.noSuchChannel);
			await deps.channelFollowingService.unfollow(actor, channel);
		});
}
