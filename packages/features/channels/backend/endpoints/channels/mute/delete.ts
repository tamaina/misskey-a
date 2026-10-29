/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { channelsMuteDeleteContract, channelsMuteDeleteErrors } from './delete.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { type ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
export interface ChannelsMuteDeleteDependencies {
	channelsRepository: ChannelsRepository;
	channelMutingService: ChannelMutingService;
}
export function createChannelsMuteDeleteProcedure<Actor extends MiLocalUser>(deps: ChannelsMuteDeleteDependencies) {
	return createApiProcedure<Actor>()(channelsMuteDeleteContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const channel = await deps.channelsRepository.findOneBy({ id: input.channelId });
			if (channel == null) throw apiError(channelsMuteDeleteErrors.noSuchChannel);
			const isMuted = await deps.channelMutingService.isMuted({ requestUserId: actor.id, targetChannelId: channel.id });
			if (!isMuted) throw apiError(channelsMuteDeleteErrors.notMuting);
			await deps.channelMutingService.unmute({ requestUserId: actor.id, targetChannelId: channel.id });
		});
}
