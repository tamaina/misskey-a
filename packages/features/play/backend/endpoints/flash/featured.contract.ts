/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedFlashSchema } from '../../flash.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const flashFeaturedInput = objectInput({
	"offset": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(0)), 0),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const flashFeaturedOutput = v.array(packedFlashSchema);

const requestName = 'flash/featured';
export const flashFeaturedContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['flash'], })
	.errors(commonErrors)
	.input(flashFeaturedInput)
	.output(flashFeaturedOutput);
