/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { onlineUsersCountContract, onlineUsersCountGetContract } from './get-online-users-count.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type OnlineUsersCountDependencies = Pick<InstanceApiDependencies, 'getOnlineUsersCount' | 'now'>;
export function createOnlineUsersCountProcedure<Actor extends ApiActor>(deps: OnlineUsersCountDependencies) {
	const now = deps.now ?? Date.now;
	return createApiProcedure<Actor>()(onlineUsersCountContract)
		.handler(async ({ input, context }) => {
			return { count: await deps.getOnlineUsersCount.countSince(new Date(now() - deps.getOnlineUsersCount.thresholdMs)) };
		});
}
export type OnlineUsersCountGetDependencies = Pick<InstanceApiDependencies, 'getOnlineUsersCount' | 'now'>;
export function createOnlineUsersCountGetProcedure<Actor extends ApiActor>(deps: OnlineUsersCountGetDependencies) {
	const now = deps.now ?? Date.now;
	return createApiProcedure<Actor>()(onlineUsersCountGetContract)
		.handler(async ({ input, context }) => {
			return { count: await deps.getOnlineUsersCount.countSince(new Date(now() - deps.getOnlineUsersCount.thresholdMs)) };
		});
}
