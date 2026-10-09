/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../operations.js';
import { adminSendEmailContract } from './send-email.contract.js';

export function createAdminSendEmailProcedure<Actor extends ApiActor>() {
	return implement(adminSendEmailContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/send-email', requireCredential: true, requireModerator: true, kind: 'write:admin:send-email' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.adminSendEmail(input, context.principal));
}
