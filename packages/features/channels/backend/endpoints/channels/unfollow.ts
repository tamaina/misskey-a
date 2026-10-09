/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsUnfollowContract, channelsUnfollowPolicy } from './unfollow.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ChannelsApiContext } from '../../operations.js';

export function createChannelsUnfollowProcedure<Actor extends ApiActor>() {
	return implement(channelsUnfollowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsUnfollowPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsUnfollow(input, context.principal));
}
