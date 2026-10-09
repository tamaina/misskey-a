/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasUpdateContract } from './update.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { TimelinesContext } from '../../operations.js';

export function createAntennasUpdateProcedure<Actor extends ApiActor>() {
	return implement(antennasUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<TimelinesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'antennas/update', requireCredential: true, kind: 'write:account', prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.timelines.antennasUpdate(input, context.principal));
}
