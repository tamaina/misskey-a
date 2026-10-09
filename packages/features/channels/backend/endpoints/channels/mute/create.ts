/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { channelsMuteCreateContract, channelsMuteCreateErrors } from './create.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { type ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
export interface ChannelsMuteCreateDependencies {
	channelsRepository: ChannelsRepository;
	channelMutingService: ChannelMutingService;
}
export function createChannelsMuteCreateProcedure<Actor extends MiLocalUser>(deps: ChannelsMuteCreateDependencies) {
	return createApiProcedure<Actor>()(channelsMuteCreateContract)
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
