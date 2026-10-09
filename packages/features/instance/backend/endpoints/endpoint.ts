/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { endpointContract } from './endpoint.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { InstanceApiContext } from '../operations.js';

export function createEndpointProcedure<Actor extends ApiActor>() {
	return implement(endpointContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'endpoint' }))
		.handler(({ input, context }) => context.operations.instance.endpoint(input));
}
