/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { channelsShowContract, channelsShowErrors } from './show.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsShowDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
}
export function createChannelsShowProcedure<Actor extends MiLocalUser>(deps: ChannelsShowDependencies) {
	return createApiProcedure<Actor>()(channelsShowContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const channel = await deps.channelsRepository.findOneBy({
				id: ps.channelId,
			});

			if (channel == null) {
				throw apiError(channelsShowErrors.noSuchChannel);
			}
			return toPackedChannel(await deps.channelEntityService.pack(channel, me, true));
		});
}
