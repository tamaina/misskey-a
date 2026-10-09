/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { adCreateContract } from './create.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { InstanceApiContext } from '../../../operations.js';

export function createAdCreateProcedure<Actor extends ApiActor>() {
	return implement(adCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/ad/create', requireCredential: true, requireModerator: true, kind: 'write:admin:ad' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.instance.adCreate(input, context.principal));
}
