/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from './input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

export const endpointsInput = v.optional(objectInput({}), {});
export const endpointsContract = oc.$meta<{ requestName: 'endpoints'; allowGet: boolean; cacheSec?: number }>({ requestName: 'endpoints', allowGet: false })
	.route({ method: 'POST', path: '/endpoints', operationId: 'post___endpoints', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(endpointsInput)
	.output(v.array(v.string()));
