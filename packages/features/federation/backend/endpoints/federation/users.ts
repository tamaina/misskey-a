/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../operations.js';
import { federationUsersContract } from './users.contract.js';

export function createFederationUsersProcedure<Actor extends ApiActor>() {
	return implement(federationUsersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'federation/users' }))
		.handler(({ input, context }) => context.operations.federation.federationUsers(input, context.principal));
}
