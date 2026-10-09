/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotificationsContext } from '../../operations.js';
import { registerContract } from './register.contract.js';

export function createRegisterProcedure<Actor extends ApiActor>() {
	return implement(registerContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotificationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'sw/register', requireCredential: true, secure: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notifications.register(input, context.principal));
}
