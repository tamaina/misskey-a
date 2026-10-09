/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { onlineUsersCountContract, onlineUsersCountGetContract } from './get-online-users-count.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { InstanceApiContext } from '../operations.js';

export function createOnlineUsersCountProcedure<Actor extends ApiActor>() {
	return implement(onlineUsersCountContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'get-online-users-count' }))
		.handler(({ input, context }) => context.operations.instance.onlineUsersCount(input));
}

export function createOnlineUsersCountGetProcedure<Actor extends ApiActor>() {
	return implement(onlineUsersCountGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'get-online-users-count' }))
		.handler(({ input, context }) => context.operations.instance.onlineUsersCount(input));
}
