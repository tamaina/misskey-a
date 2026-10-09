/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';

export const pingContract = oc.$meta({ requestName: 'ping', allowGet: false } as const)
	.route({ method: 'POST', path: '/ping', operationId: 'post___ping', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({}), {}))
	.output(v.strictObject({ pong: v.pipe(v.number(), v.finite()) }));
