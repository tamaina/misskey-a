/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../operations.js';
import { chartFederationContract, chartFederationGetContract } from './federation.contract.js';

export function createFederationProcedure<Actor extends ApiActor>() {
	return implement(chartFederationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/federation' }))
		.handler(({ input, context }) => context.operations.statistics.federation(input, context.principal));
}

export function createFederationGetProcedure<Actor extends ApiActor>() {
	return implement(chartFederationGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/federation' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.federation(input, context.principal));
}
