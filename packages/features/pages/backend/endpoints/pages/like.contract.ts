/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const pagesLikeErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: 'cc98a8a2-0dc3-4123-b198-62c71df18ed3' },
	yourPage: { message: 'You cannot like your page.', code: 'YOUR_PAGE', id: '28800466-e6db-40f2-8fae-bf9e82aa92b8' },
	alreadyLiked: { message: 'The page has already been liked.', code: 'ALREADY_LIKED', id: 'd4c1edbe-7da2-4eae-8714-1acfd2d63941' },
} as const;

const requestName = 'pages/like';
export const pagesLikeContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['pages'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData }, YOUR_PAGE: { status: 400, data: apiErrorData }, ALREADY_LIKED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"pageId": misskeyId,
	}))
	.output(v.void());
