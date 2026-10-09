/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../operations.js';
import { federationFollowersContract } from './followers.contract.js';

export function createFederationFollowersProcedure<Actor extends ApiActor>() {
	return implement(federationFollowersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'federation/followers' }))
		.handler(({ input, context }) => context.operations.federation.federationFollowers(input, context.principal));
}
