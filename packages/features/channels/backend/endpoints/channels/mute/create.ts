/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsMuteCreateContract, channelsMuteCreatePolicy, channelsMuteCreateErrors } from './create.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
export interface ChannelsMuteCreateDependencies {
	channelsRepository: ChannelsRepository;
	channelMutingService: ChannelMutingService;
}
export function createChannelsMuteCreateProcedure<Actor extends MiLocalUser>(deps: ChannelsMuteCreateDependencies) {
	return implement(channelsMuteCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMuteCreatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsMuteCreateErrors.noSuchChannel);
			const isAlreadyMuted = await deps.channelMutingService.isMuted({ requestUserId: actor.id, targetChannelId: channel.id });
			if (isAlreadyMuted) throw apiError(channelsMuteCreateErrors.alreadyMuting);
			// Preserve the legacy truthy check: null, zero, and an omitted value create an indefinite mute.
			if (input.expiresAt && input.expiresAt <= Date.now()) {
				throw apiError(channelsMuteCreateErrors.expiresAtIsPast);
			}
			await deps.channelMutingService.mute({
				requestUserId: actor.id,
				targetChannelId: channel.id,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
			});
		});
}
