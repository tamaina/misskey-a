/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';

export const endpointContract = oc.$meta({ requestName: 'endpoint', allowGet: false } as const)
	.route({ method: 'POST', path: '/endpoint', operationId: 'post___endpoint', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(objectInput({ endpoint: v.string() }))
	.output(v.nullable(v.strictObject({ params: v.array(v.strictObject({ name: v.string(), type: v.string() })) })));
