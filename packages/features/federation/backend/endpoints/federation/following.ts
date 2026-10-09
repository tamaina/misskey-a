/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../operations.js';
import { federationFollowingContract } from './following.contract.js';

export function createFederationFollowingProcedure<Actor extends ApiActor>() {
	return implement(federationFollowingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'federation/following' }))
		.handler(({ input, context }) => context.operations.federation.federationFollowing(input, context.principal));
}
