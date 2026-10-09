/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { adminMetaContract } from './meta.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { InstanceApiContext } from '../../operations.js';

export function createAdminMetaProcedure<Actor extends ApiActor>() {
	return implement(adminMetaContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/meta', requireCredential: true, requireAdmin: true, kind: 'read:admin:meta' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.instance.adminMeta(input, context.principal));
}
