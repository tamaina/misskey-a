/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const flashUnlikeInput = objectInput({
	"flashId": misskeyId,
});
export const flashUnlikeOutput = v.void();
export const flashUnlikeErrors = {
	noSuchFlash: { message: 'No such flash.', code: 'NO_SUCH_FLASH', id: 'afe8424a-a69e-432d-a5f2-2f0740c62410' },
	notLiked: { message: 'You have not liked that flash.', code: 'NOT_LIKED', id: '755f25a7-9871-4f65-9f34-51eaad9ae0ac' },
} as const;

const requestName = 'flash/unlike';
export const flashUnlikeContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['flash'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_FLASH: { status: 400, data: apiErrorData }, NOT_LIKED: { status: 400, data: apiErrorData } })
	.input(flashUnlikeInput)
	.output(flashUnlikeOutput);
