/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../../operations.js';
import { chartPerUserDriveContract, chartPerUserDriveGetContract } from './drive.contract.js';

export function createPerUserDriveProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserDriveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/drive' }))
		.handler(({ input, context }) => context.operations.statistics.userDrive(input, context.principal));
}

export function createPerUserDriveGetProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserDriveGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/drive' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.userDrive(input, context.principal));
}
