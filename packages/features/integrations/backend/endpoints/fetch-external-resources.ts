/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../operations.js';
import { fetchExternalResourcesContract } from './fetch-external-resources.contract.js';
import ms from 'ms';

export function createFetchExternalResourcesProcedure<Actor extends ApiActor>() {
	return implement(fetchExternalResourcesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'fetch-external-resources', requireCredential: true, secure: true, limit: {
		duration: ms('1hour'),
		max: 50,
	} }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.integrations.fetchExternalResources(input, context.principal));
}
