/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsUnfollowContract, channelsUnfollowPolicy, channelsUnfollowErrors } from './unfollow.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
export interface ChannelsUnfollowDependencies {
	channelsRepository: ChannelsRepository;
	channelFollowingService: ChannelFollowingService;
}
export function createChannelsUnfollowProcedure<Actor extends MiLocalUser>(deps: ChannelsUnfollowDependencies) {
	return implement(channelsUnfollowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsUnfollowPolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsUnfollowErrors.noSuchChannel);
			await deps.channelFollowingService.unfollow(actor, channel);
		});
}
