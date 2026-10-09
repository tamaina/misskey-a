/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../operations.js';
import { federationShowInstanceContract } from './show-instance.contract.js';

export function createFederationShowInstanceProcedure<Actor extends ApiActor>() {
	return implement(federationShowInstanceContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'federation/show-instance' }))
		.handler(({ input, context }) => context.operations.federation.federationShowInstance(input, context.principal));
}
