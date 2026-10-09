/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../operations.js';
import { chartActiveUsersContract, chartActiveUsersGetContract } from './active-users.contract.js';

export function createActiveUsersProcedure<Actor extends ApiActor>() {
	return implement(chartActiveUsersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/active-users' }))
		.handler(({ input, context }) => context.operations.statistics.activeUsers(input, context.principal));
}

export function createActiveUsersGetProcedure<Actor extends ApiActor>() {
	return implement(chartActiveUsersGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/active-users' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.activeUsers(input, context.principal));
}
