/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsMuteDeleteContract, channelsMuteDeletePolicy, channelsMuteDeleteErrors } from './delete.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
export interface ChannelsMuteDeleteDependencies {
	channelsRepository: ChannelsRepository;
	channelMutingService: ChannelMutingService;
}
export function createChannelsMuteDeleteProcedure<Actor extends MiLocalUser>(deps: ChannelsMuteDeleteDependencies) {
	return implement(channelsMuteDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMuteDeletePolicy))
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
