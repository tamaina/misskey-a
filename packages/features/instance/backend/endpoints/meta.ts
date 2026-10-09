/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { metaContract } from './meta.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { InstanceApiContext } from '../operations.js';

export function createMetaProcedure<Actor extends ApiActor>() {
	return implement(metaContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<InstanceApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'meta' }))
		.handler(({ input, context }) => context.operations.instance.meta(input));
}
