/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';

export const endpointsContract = oc.$meta({ requestName: 'endpoints', allowGet: false } as const)
	.route({ method: 'POST', path: '/endpoints', operationId: 'post___endpoints', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({}), {}))
	.output(v.array(v.string()));
