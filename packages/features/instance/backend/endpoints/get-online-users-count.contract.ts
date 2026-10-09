/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from './input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

export const onlineUsersCountInput = v.optional(objectInput({}), {});
export const onlineUsersCountOutput = v.strictObject({ count: v.pipe(v.number(), v.finite()) });
export const onlineUsersCountContract = oc.$meta<{ requestName: 'get-online-users-count'; allowGet: boolean; cacheSec?: number }>({ requestName: 'get-online-users-count', allowGet: true, cacheSec: 60 })
	.route({ method: 'POST', path: '/get-online-users-count', operationId: 'post___get-online-users-count', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(onlineUsersCountInput)
	.output(onlineUsersCountOutput);

/** GET is an HTTP alias; the SDK continues to address the canonical POST request name. */
export const onlineUsersCountGetContract = oc.$meta<{ cacheSec: number }>({ cacheSec: 60 })
	.route({ method: 'GET', path: '/get-online-users-count', operationId: 'get___get-online-users-count', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(onlineUsersCountInput)
	.output(onlineUsersCountOutput);
