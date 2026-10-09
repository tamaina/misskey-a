/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../../operations.js';
import { iWebhooksListContract } from './list.contract.js';

export function createIWebhooksListProcedure<Actor extends ApiActor>() {
	return implement(iWebhooksListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/webhooks/list', requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.iWebhooksList(input, context.principal));
}
