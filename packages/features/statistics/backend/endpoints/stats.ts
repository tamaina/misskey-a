/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { statsContract } from './stats.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../operations.js';

export function createStatsProcedure<Actor extends ApiActor>() {
	return implement(statsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'stats' }))
		.handler(({ input, context }) => context.operations.statistics.stats(input, context.principal));
}
