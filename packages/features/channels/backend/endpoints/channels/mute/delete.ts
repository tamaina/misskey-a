/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsMuteDeleteContract, channelsMuteDeletePolicy } from './delete.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ChannelsApiContext } from '../../../operations.js';

export function createChannelsMuteDeleteProcedure<Actor extends ApiActor>() {
	return implement(channelsMuteDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMuteDeletePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsMuteDelete(input, context.principal));
}
