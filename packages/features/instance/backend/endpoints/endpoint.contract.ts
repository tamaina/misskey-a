/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';

export const endpointContract = oc.$meta({
	requestName: 'endpoint',
	allowGet: false,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/endpoint', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(objectInput({ endpoint: v.string() }))
	.output(v.nullable(v.strictObject({ params: v.array(v.strictObject({ name: v.string(), type: v.string() })) })));
