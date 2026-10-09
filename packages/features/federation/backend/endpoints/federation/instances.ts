/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { federationInstancesContract } from './instances.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../operations.js';

export function createFederationInstancesProcedure<Actor extends ApiActor>() {
	return implement(federationInstancesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'federation/instances' }))
		.handler(({ input, context }) => context.operations.federation.federationInstances(input, context.principal));
}
