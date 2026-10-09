/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedFlashSchema } from '../../flash.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const flashShowErrors = {
	noSuchFlash: { message: 'No such flash.', code: 'NO_SUCH_FLASH', id: 'f0d34a1a-d29a-401d-90ba-1982122b5630' },
} as const;

const requestName = 'flash/show';
export const flashShowContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['flashs'], })
	.errors({ ...commonErrors, NO_SUCH_FLASH: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"flashId": misskeyId,
	}))
	.output(packedFlashSchema);
