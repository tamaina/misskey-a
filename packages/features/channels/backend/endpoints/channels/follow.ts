/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsFollowContract, channelsFollowPolicy, channelsFollowErrors } from './follow.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
export interface ChannelsFollowDependencies {
	channelsRepository: ChannelsRepository;
	channelFollowingService: ChannelFollowingService;
}
export function createChannelsFollowProcedure<Actor extends MiLocalUser>(deps: ChannelsFollowDependencies) {
	return implement(channelsFollowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsFollowPolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsFollowErrors.noSuchChannel);
			try {
				await deps.channelFollowingService.follow(actor, channel);
			} catch (error) {
				if (error instanceof IdentifiableError && error.id === '6e335e39-0203-4418-a936-b3f2dc987845') {
					throw apiError(channelsFollowErrors.alreadyFollowing);
				}
				throw error;
			}
		});
}
