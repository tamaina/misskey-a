/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '../transport/api-procedure.js';
import type { ApiActor } from '../transport/context.js';
import { testContract } from './test.contract.js';

export function createTestProcedure<Actor extends ApiActor>() {
 return createApiProcedure<Actor>()(testContract)
  .handler(({ input }) => input);
}
