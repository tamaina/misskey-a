/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { pinnedUsersContract } from './pinned-users.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { InstanceApiContext } from '../operations.js';

export function createPinnedUsersProcedure<Actor extends ApiActor>() {
	return implement(pinnedUsersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'pinned-users' }))
		.handler(({ input, context }) => context.operations.instance.pinnedUsers(input, context.principal));
}
