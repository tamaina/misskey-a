/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedPageSchema } from '../../../../users/backend/page.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const pagesFeaturedInput = objectInput({});
export const pagesFeaturedOutput = v.array(packedPageSchema);

const requestName = 'pages/featured';
export const pagesFeaturedContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['pages'], })
	.errors(commonErrors)
	.input(pagesFeaturedInput)
	.output(pagesFeaturedOutput);
