/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import { chartPerUserReactionsContract, chartPerUserReactionsGetContract } from './reactions.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../../operations.js';

export function createPerUserReactionsProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserReactionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/reactions' }))
		.handler(({ input, context }) => context.operations.statistics.userReactions(input, context.principal));
}

export function createPerUserReactionsGetProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserReactionsGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/reactions' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.userReactions(input, context.principal));
}
