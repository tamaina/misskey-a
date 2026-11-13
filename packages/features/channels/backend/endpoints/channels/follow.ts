/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { channelsFollowContract, channelsFollowErrors } from './follow.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { type ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
export interface ChannelsFollowDependencies {
	channelsRepository: ChannelsRepository;
	channelFollowingService: ChannelFollowingService;
}
export function createChannelsFollowProcedure<Actor extends MiLocalUser>(deps: ChannelsFollowDependencies) {
	return createApiProcedure<Actor>()(channelsFollowContract)
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
