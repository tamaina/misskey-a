/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../../operations.js';
import { iWebhooksShowContract } from './show.contract.js';

export function createIWebhooksShowProcedure<Actor extends ApiActor>() {
	return implement(iWebhooksShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/webhooks/show', requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.iWebhooksShow(input, context.principal));
}
