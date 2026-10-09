/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../transport/input.schema.js';
import { commonErrors } from '../transport/errors.schema.js';

const id = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const testInput = objectInput({ required: v.boolean(), string: v.exactOptional(v.string()),
 default: v.optional(v.string(), 'hello'), nullableDefault: v.optional(v.nullable(v.string()), 'hello'), id: v.exactOptional(id),
});
export const testOutput = v.strictObject({ required: v.boolean(), string: v.exactOptional(v.string()),
 default: v.string(), nullableDefault: v.nullable(v.string()), id: v.exactOptional(id),
});
const requestName = 'test';
export const testContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
 .route({ method: 'POST', path: '/test', operationId: 'post___test', tags: ['non-productive'], description: 'Endpoint for testing input validation.' })
 .errors(commonErrors).input(testInput).output(testOutput);
