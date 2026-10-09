/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { pingContract } from './ping.contract.js';
import type { InstanceApiDependencies } from '../api.dependencies.js';
export type PingDependencies = Pick<InstanceApiDependencies, 'now'>;
export function createPingProcedure<Actor extends ApiActor>(deps: PingDependencies) {
	const now = deps.now ?? Date.now;
	return implement(pingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'ping' }))
		.handler(async ({ input, context }) => {
			return { pong: now() };
		});
}
