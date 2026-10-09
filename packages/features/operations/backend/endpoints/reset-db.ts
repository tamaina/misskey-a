/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { OperationsApiContext } from '../operations.js';
import { resetDbContract } from './reset-db.contract.js';

export function createResetDbProcedure<Actor extends ApiActor>() {
	return implement(resetDbContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<OperationsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'reset-db' }))
		.handler(({ input, context }) => context.operations.operations.resetDb(input, context.principal));
}
