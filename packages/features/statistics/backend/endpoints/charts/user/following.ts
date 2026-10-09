/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../../operations.js';
import { chartPerUserFollowingContract, chartPerUserFollowingGetContract } from './following.contract.js';

export function createPerUserFollowingProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserFollowingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/following' }))
		.handler(({ input, context }) => context.operations.statistics.userFollowing(input, context.principal));
}

export function createPerUserFollowingGetProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserFollowingGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/following' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.userFollowing(input, context.principal));
}
