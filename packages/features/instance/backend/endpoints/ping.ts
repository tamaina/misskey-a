/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { pingContract } from './ping.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { InstanceApiContext } from '../operations.js';

export function createPingProcedure<Actor extends ApiActor>() {
	return implement(pingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'ping' }))
		.handler(({ input, context }) => context.operations.instance.ping(input));
}
