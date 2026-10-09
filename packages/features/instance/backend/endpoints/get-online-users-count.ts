/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { onlineUsersCountContract, onlineUsersCountGetContract } from './get-online-users-count.contract.js';
import type { InstanceApiDependencies } from '../api.dependencies.js';
export type OnlineUsersCountDependencies = Pick<InstanceApiDependencies, 'getOnlineUsersCount' | 'now'>;
export function createOnlineUsersCountProcedure<Actor extends ApiActor>(deps: OnlineUsersCountDependencies) {
	const now = deps.now ?? Date.now;
	return implement(onlineUsersCountContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'get-online-users-count' }))
		.handler(async ({ input, context }) => {
			return { count: await deps.getOnlineUsersCount.countSince(new Date(now() - deps.getOnlineUsersCount.thresholdMs)) };
		});
}
export type OnlineUsersCountGetDependencies = Pick<InstanceApiDependencies, 'getOnlineUsersCount' | 'now'>;
export function createOnlineUsersCountGetProcedure<Actor extends ApiActor>(deps: OnlineUsersCountGetDependencies) {
	const now = deps.now ?? Date.now;
	return implement(onlineUsersCountGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'get-online-users-count' }))
		.handler(async ({ input, context }) => {
			return { count: await deps.getOnlineUsersCount.countSince(new Date(now() - deps.getOnlineUsersCount.thresholdMs)) };
		});
}
