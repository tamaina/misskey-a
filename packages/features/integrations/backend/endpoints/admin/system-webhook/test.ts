/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../../../operations.js';
import { adminSystemWebhookTestContract } from './test.contract.js';
import ms from 'ms';

export function createAdminSystemWebhookTestProcedure<Actor extends ApiActor>() {
	return implement(adminSystemWebhookTestContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/system-webhook/test', requireCredential: true, requireModerator: true, secure: true, kind: 'read:admin:system-webhook', limit: {
		duration: ms('15min'),
		max: 60,
	} }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.adminSystemWebhookTest(input, context.principal));
}
