/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const flashDeleteErrors = {
	noSuchFlash: { message: 'No such flash.', code: 'NO_SUCH_FLASH', id: 'de1623ef-bbb3-4289-a71e-14cfa83d9740' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '1036ad7b-9f92-4fff-89c3-0e50dc941704' },
} as const;

const requestName = 'flash/delete';
export const flashDeleteContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['flashs'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_FLASH: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"flashId": misskeyId,
	}))
	.output(v.void());
