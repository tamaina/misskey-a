/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsShowContract, channelsShowPolicy, channelsShowErrors } from './show.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsShowDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
}
export function createChannelsShowProcedure<Actor extends MiLocalUser>(deps: ChannelsShowDependencies) {
	return implement(channelsShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsShowPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const channel = await deps.channelsRepository.findOneBy({
				id: ps.channelId,
			});

			if (channel == null) {
				throw apiError(channelsShowErrors.noSuchChannel);
			}
			return v.parse(packedChannelSchema, await deps.channelEntityService.pack(channel, me, true));
		});
}
