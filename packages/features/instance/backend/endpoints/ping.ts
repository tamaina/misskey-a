/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { pingContract } from './ping.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type PingDependencies = Pick<InstanceApiDependencies, 'now'>;
export function createPingProcedure<Actor extends ApiActor>(deps: PingDependencies) {
	const now = deps.now ?? Date.now;
	return createApiProcedure<Actor>()(pingContract)
		.handler(async ({ input, context }) => {
			return { pong: now() };
		});
}
