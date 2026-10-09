/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartPerUserDriveContract, chartPerUserDriveGetContract } from './drive.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../../api.implementation.js';
export function createPerUserDriveProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userDrive']) {
	return implement(chartPerUserDriveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartPerUserDriveContract['~orpc'].meta.requestName }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId));
}
export function createPerUserDriveGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userDrive']) {
	return implement(chartPerUserDriveGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartPerUserDriveContract['~orpc'].meta.requestName }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId));
}
