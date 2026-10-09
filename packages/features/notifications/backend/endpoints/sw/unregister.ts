/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { unregisterContract } from './unregister.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotificationsContext } from '../../operations.js';

export function createUnregisterProcedure<Actor extends ApiActor>() {
	return implement(unregisterContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotificationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'sw/unregister', limit: { duration: 3600000, max: 30 } }))
		.handler(({ input, context }) => context.operations.notifications.unregister(input, context.principal));
}
