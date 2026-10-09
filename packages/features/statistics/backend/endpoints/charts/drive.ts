/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { chartDriveContract, chartDriveGetContract } from './drive.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../operations.js';

export function createDriveProcedure<Actor extends ApiActor>() {
	return implement(chartDriveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/drive' }))
		.handler(({ input, context }) => context.operations.statistics.drive(input, context.principal));
}

export function createDriveGetProcedure<Actor extends ApiActor>() {
	return implement(chartDriveGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/drive' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.drive(input, context.principal));
}
