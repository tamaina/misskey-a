/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from './input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

export const pingInput = v.optional(objectInput({}), {});
export const pingContract = oc.$meta<{ requestName: 'ping'; allowGet: boolean; cacheSec?: number }>({ requestName: 'ping', allowGet: false })
	.route({ method: 'POST', path: '/ping', operationId: 'post___ping', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(pingInput)
	.output(v.strictObject({ pong: v.pipe(v.number(), v.finite()) }));
