/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PlayContext } from '../../operations.js';
import { flashUpdateContract } from './update.contract.js';

export function createFlashUpdateProcedure<Actor extends ApiActor>() {
	return implement(flashUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PlayContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'flash/update', requireCredential: true, kind: 'write:flash', prohibitMoved: true, limit: { duration: 3_600_000, max: 300 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.play.flashUpdate(input, context.principal));
}
