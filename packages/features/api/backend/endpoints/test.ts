/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../transport/middleware.js';
import type { ApiActor, ApiContext } from '../transport/context.js';
import { testContract } from './test.contract.js';

export function createTestProcedure<Actor extends ApiActor>() {
 return implement(testContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
  .use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'test' }))
  .handler(({ input }) => input);
}
