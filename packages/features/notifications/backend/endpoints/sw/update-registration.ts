/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { updateRegistrationContract } from './update-registration.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotificationsContext } from '../../operations.js';

export function createUpdateRegistrationProcedure<Actor extends ApiActor>() {
	return implement(updateRegistrationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotificationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'sw/update-registration', requireCredential: true, secure: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notifications.updateRegistration(input, context.principal));
}
