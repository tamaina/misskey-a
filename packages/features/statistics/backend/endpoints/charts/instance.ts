/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { chartInstanceContract, chartInstanceGetContract } from './instance.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../operations.js';

export function createInstanceProcedure<Actor extends ApiActor>() {
	return implement(chartInstanceContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/instance' }))
		.handler(({ input, context }) => context.operations.statistics.instance(input, context.principal));
}

export function createInstanceGetProcedure<Actor extends ApiActor>() {
	return implement(chartInstanceGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/instance' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.instance(input, context.principal));
}
