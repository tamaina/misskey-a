/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedJsonObjectSchema } from '../../../../users/backend/json-value.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { pageNameSchema } from '../../page-name.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const pagesUpdateInput = objectInput({
	"pageId": misskeyId,
	"title": v.exactOptional(v.string()),
	"name": v.exactOptional(pageNameSchema),
	"summary": v.exactOptional(v.nullable(v.string())),
	"content": v.exactOptional(v.array(packedJsonObjectSchema)),
	"variables": v.exactOptional(v.array(packedJsonObjectSchema)),
	"script": v.exactOptional(v.string()),
	"eyeCatchingImageId": v.exactOptional(v.nullable(misskeyId)),
	"font": v.exactOptional(v.picklist(["serif", "sans-serif"])),
	"alignCenter": v.exactOptional(v.boolean()),
	"hideTitleWhenPinned": v.exactOptional(v.boolean()),
});
export const pagesUpdateOutput = v.void();
export const pagesUpdateErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: '21149b9e-3616-4778-9592-c4ce89f5a864' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '3c15cd52-3b4b-4274-967d-6456fc4f792b' },
	noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'cfc23c7c-3887-490e-af30-0ed576703c82' },
	nameAlreadyExists: { message: 'Specified name already exists.', code: 'NAME_ALREADY_EXISTS', id: '2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab' },
} as const;

const requestName = 'pages/update';
export const pagesUpdateContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['pages'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, NAME_ALREADY_EXISTS: { status: 400, data: apiErrorData } })
	.input(pagesUpdateInput)
	.output(pagesUpdateOutput);
