/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../../operations.js';
import { adminRelaysRemoveContract } from './remove.contract.js';

export function createAdminRelaysRemoveProcedure<Actor extends ApiActor>() {
	return implement(adminRelaysRemoveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/relays/remove', requireCredential: true, requireModerator: true, kind: 'write:admin:relays' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.federation.adminRelaysRemove(input, context.principal));
}
