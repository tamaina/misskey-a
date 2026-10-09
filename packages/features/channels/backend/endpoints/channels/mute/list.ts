/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChannelMutingService } from '../../../services/ChannelMutingService.js';
import { type ChannelEntityService } from '../../../serializers/ChannelEntityService.js';
import { channelsMuteListContract } from './list.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsMuteListDependencies {
	channelMutingService: ChannelMutingService;
	channelEntityService: ChannelEntityService;
}
export function createChannelsMuteListProcedure<Actor extends MiLocalUser>(deps: ChannelsMuteListDependencies) {
	return createApiProcedure<Actor>()(channelsMuteListContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const mutings = await deps.channelMutingService.list({
				requestUserId: me.id,
			});
			return (await deps.channelEntityService.packMany(mutings, me)).map(toPackedChannel);
		});
}
