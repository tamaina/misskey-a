/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { fetchRssContract } from './fetch-rss.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { IntegrationsContext } from '../operations.js';

export function createFetchRssProcedure<Actor extends ApiActor>() {
	return implement(fetchRssContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<IntegrationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'fetch-rss', limit: {
			duration: 60 * 1000,
			max: 300,
		} }))
		.handler(({ input, context }) => context.operations.integrations.fetchRss(input, context.principal));
}
