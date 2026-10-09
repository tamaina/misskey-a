/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const pagesUnlikeErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: 'a0d41e20-1993-40bd-890e-f6e560ae648e' },
	notLiked: { message: 'You have not liked that page.', code: 'NOT_LIKED', id: 'f5e586b0-ce93-4050-b0e3-7f31af5259ee' },
} as const;

const requestName = 'pages/unlike';
export const pagesUnlikeContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['pages'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData }, NOT_LIKED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"pageId": misskeyId,
	}))
	.output(v.void());
