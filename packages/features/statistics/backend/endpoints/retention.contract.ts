/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

const finiteNumber = v.pipe(v.number(), v.finite());
export const retentionInput = v.optional(objectInput({}), {});
export const retentionOutput = v.array(v.strictObject({
	createdAt: v.pipe(v.string(), v.metadata({ format: 'date-time' })),
	users: finiteNumber,
	data: v.record(v.string(), finiteNumber),
}));

const requestName = 'retention';
export const retentionContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 3600 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName, tags: ['users'] })
	.errors(commonErrors)
	.input(retentionInput)
	.output(retentionOutput);

export const retentionGetContract = oc.$meta<{ allowGet: true; cacheSec: number }>({ allowGet: true, cacheSec: 3600 })
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['users'] })
	.errors(commonErrors)
	.input(retentionInput)
	.output(retentionOutput);
