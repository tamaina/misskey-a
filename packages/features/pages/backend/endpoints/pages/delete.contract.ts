/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const pagesDeleteErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: 'eb0c6e1d-d519-4764-9486-52a7e1c6392a' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '8b741b3e-2c22-44b3-a15f-29949aa1601e' },
} as const;

const requestName = 'pages/delete';
export const pagesDeleteContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:pages',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['pages'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"pageId": misskeyId,
	}))
	.output(v.void());
