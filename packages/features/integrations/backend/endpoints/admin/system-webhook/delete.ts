/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../../operations.js';
import { adminSystemWebhookDeleteContract } from './delete.contract.js';

export function createAdminSystemWebhookDeleteProcedure<Actor extends ApiActor>() {
	return implement(adminSystemWebhookDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/system-webhook/delete', requireCredential: true, requireModerator: true, secure: true, kind: 'write:admin:system-webhook' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.adminSystemWebhookDelete(input, context.principal));
}
