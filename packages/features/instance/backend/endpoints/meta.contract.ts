/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from './input.schema.js';
import { packedMetaDetailedSchema, packedMetaLiteSchema } from './meta.schema.js';

export const metaContract = oc.$meta({ requestName: 'meta', allowGet: false } as const)
	.route({ method: 'POST', path: '/meta', operationId: 'post___meta', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({ detail: v.optional(v.boolean(), true) }), {}))
	.output(v.union([packedMetaDetailedSchema, packedMetaLiteSchema]));
