/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from './input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedMetaDetailedSchema, packedMetaLiteSchema } from './meta.schema.js';

export const metaInput = v.optional(objectInput({ detail: v.optional(v.boolean(), true) }), {});
export const metaOutput = v.union([packedMetaDetailedSchema, packedMetaLiteSchema]);
export const metaContract = oc.$meta<{ requestName: 'meta'; allowGet: boolean; cacheSec?: number }>({ requestName: 'meta', allowGet: false })
	.route({ method: 'POST', path: '/meta', operationId: 'post___meta', tags: ['meta'] })
	.errors({ ...commonErrors })
	.input(metaInput)
	.output(metaOutput);
