/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../../operations.js';
import { adminFederationRemoveAllFollowingContract } from './remove-all-following.contract.js';

export function createAdminFederationRemoveAllFollowingProcedure<Actor extends ApiActor>() {
	return implement(adminFederationRemoveAllFollowingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/federation/remove-all-following', requireCredential: true, requireModerator: true, kind: 'write:admin:federation' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.federation.adminFederationRemoveAllFollowing(input, context.principal));
}
