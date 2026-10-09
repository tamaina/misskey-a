/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import * as v from 'valibot';
import { packedChannelSchema } from '../../../channel.schema.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChannelMutingService } from '../../../services/ChannelMutingService.js';
import { ChannelEntityService } from '../../../serializers/ChannelEntityService.js';
import { channelsMuteListContract, channelsMuteListPolicy } from './list.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsMuteListDependencies {
	channelMutingService: ChannelMutingService;
	channelEntityService: ChannelEntityService;
}
export function createChannelsMuteListProcedure<Actor extends MiLocalUser>(deps: ChannelsMuteListDependencies) {
	return implement(channelsMuteListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMuteListPolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const mutings = await deps.channelMutingService.list({
				requestUserId: me.id,
			});
			return v.parse(v.array(packedChannelSchema), await deps.channelEntityService.packMany(mutings, me));
		});
}
