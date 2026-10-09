/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { updateMetaContract } from './update-meta.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { InstanceApiContext } from '../../operations.js';

export function createUpdateMetaProcedure<Actor extends ApiActor>() {
	return implement(updateMetaContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/update-meta', requireCredential: true, requireAdmin: true, kind: 'write:admin:meta' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.instance.updateMeta(input, context.principal));
}
