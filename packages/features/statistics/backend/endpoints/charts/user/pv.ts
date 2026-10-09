/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import { chartPerUserPvContract, chartPerUserPvGetContract } from './pv.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../../operations.js';

export function createPerUserPvProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserPvContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/pv' }))
		.handler(({ input, context }) => context.operations.statistics.userPv(input, context.principal));
}

export function createPerUserPvGetProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserPvGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/pv' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.userPv(input, context.principal));
}
