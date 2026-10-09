/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../../operations.js';
import { iWebhooksTestContract } from './test.contract.js';
import ms from 'ms';

export function createIWebhooksTestProcedure<Actor extends ApiActor>() {
	return implement(iWebhooksTestContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/webhooks/test', requireCredential: true, secure: true, kind: 'read:account', limit: {
		duration: ms('15min'),
		max: 60,
	} }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.iWebhooksTest(input, context.principal));
}
