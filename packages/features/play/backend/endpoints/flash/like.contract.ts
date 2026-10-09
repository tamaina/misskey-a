/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const flashLikeErrors = {
	noSuchFlash: { message: 'No such flash.', code: 'NO_SUCH_FLASH', id: 'c07c1491-9161-4c5c-9d75-01906f911f73' },
	yourFlash: { message: 'You cannot like your flash.', code: 'YOUR_FLASH', id: '3fd8a0e7-5955-4ba9-85bb-bf3e0c30e13b' },
	alreadyLiked: { message: 'The flash has already been liked.', code: 'ALREADY_LIKED', id: '010065cf-ad43-40df-8067-abff9f4686e3' },
} as const;

const requestName = 'flash/like';
export const flashLikeContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['flash'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_FLASH: { status: 400, data: apiErrorData }, YOUR_FLASH: { status: 400, data: apiErrorData }, ALREADY_LIKED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"flashId": misskeyId,
	}))
	.output(v.void());
