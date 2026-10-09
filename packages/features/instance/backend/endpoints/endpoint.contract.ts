/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from './input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

export const endpointInput = objectInput({ endpoint: v.string() });
export const endpointContract = oc.$meta<{ requestName: 'endpoint'; allowGet: boolean; cacheSec?: number }>({ requestName: 'endpoint', allowGet: false })
	.route({ method: 'POST', path: '/endpoint', operationId: 'post___endpoint', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(endpointInput)
	.output(v.nullable(v.strictObject({ params: v.array(v.strictObject({ name: v.string(), type: v.string() })) })));
