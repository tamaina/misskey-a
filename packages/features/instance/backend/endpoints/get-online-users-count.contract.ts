/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';

export const onlineUsersCountContract = oc.$meta({ requestName: 'get-online-users-count', allowGet: true, cacheSec: 60 } as const)
	.route({ method: 'POST', path: '/get-online-users-count', operationId: 'post___get-online-users-count', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({}), {}))
	.output(v.strictObject({ count: v.pipe(v.number(), v.finite()) }));

/** GET is an HTTP alias; the SDK continues to address the canonical POST request name. */
export const onlineUsersCountGetContract = oc.$meta({ cacheSec: 60 } as const)
	.route({ method: 'GET', path: '/get-online-users-count', operationId: 'get___get-online-users-count', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(requiredSchema(onlineUsersCountContract['~orpc'].inputSchema))
	.output(requiredSchema(onlineUsersCountContract['~orpc'].outputSchema));

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
