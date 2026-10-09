/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PlayContext } from '../../operations.js';
import { flashCreateContract } from './create.contract.js';

export function createFlashCreateProcedure<Actor extends ApiActor>() {
	return implement(flashCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PlayContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'flash/create', requireCredential: true, kind: 'write:flash', prohibitMoved: true, limit: { duration: 3_600_000, max: 10 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.play.flashCreate(input, context.principal));
}
