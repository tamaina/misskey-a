/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../operations.js';
import { apGetContract } from './get.contract.js';
import ms from 'ms';

export function createApGetProcedure<Actor extends ApiActor>() {
	return implement(apGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'ap/get', requireCredential: true, requireAdmin: true, kind: 'read:federation', limit: {
		duration: ms('1hour'),
		max: 30,
	} }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.federation.apGet(input, context.principal));
}
