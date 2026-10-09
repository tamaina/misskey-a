/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedJsonObjectSchema } from '../../../../users/backend/json-value.schema.js';

export const apGetInput = objectInput({
	"uri": v.string(),
});
export const apGetOutput = packedJsonObjectSchema;
export const apGetErrors = {
	} as const;

const requestName = 'ap/get';
export const apGetContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['federation'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(apGetInput).output(apGetOutput);
