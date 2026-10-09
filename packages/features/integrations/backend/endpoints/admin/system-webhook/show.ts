/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../../operations.js';
import { adminSystemWebhookShowContract } from './show.contract.js';

export function createAdminSystemWebhookShowProcedure<Actor extends ApiActor>() {
	return implement(adminSystemWebhookShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/system-webhook/show', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:system-webhook' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.adminSystemWebhookShow(input, context.principal));
}
