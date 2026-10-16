/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';
import { packedMetaDetailedSchema, packedMetaLiteSchema } from './meta.schema.js';

export const metaContract = oc.$meta({
	requestName: 'meta',
	allowGet: false,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/meta', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({ detail: v.optional(v.boolean(), true) }), {}))
	.output(v.union([packedMetaDetailedSchema, packedMetaLiteSchema]));
