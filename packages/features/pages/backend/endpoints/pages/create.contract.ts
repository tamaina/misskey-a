/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedPageSchema } from '../../../../users/backend/page.schema.js';
import { packedJsonObjectSchema } from '../../../../users/backend/json-value.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { pageNameSchema } from '../../page-name.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const pagesCreateInput = objectInput({
	"title": v.string(),
	"name": pageNameSchema,
	"summary": v.exactOptional(v.nullable(v.string())),
	"content": v.array(packedJsonObjectSchema),
	"variables": v.array(packedJsonObjectSchema),
	"script": v.string(),
	"eyeCatchingImageId": v.exactOptional(v.nullable(misskeyId)),
	"font": v.optional(v.picklist(["serif", "sans-serif"]), "sans-serif"),
	"alignCenter": v.optional(v.boolean(), false),
	"hideTitleWhenPinned": v.optional(v.boolean(), false),
});
export const pagesCreateOutput = packedPageSchema;
export const pagesCreateErrors = {
	noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'b7b97489-0f66-4b12-a5ff-b21bd63f6e1c' },
	nameAlreadyExists: { message: 'Specified name already exists.', code: 'NAME_ALREADY_EXISTS', id: '4650348e-301c-499a-83c9-6aa988c66bc1' },
} as const;

const requestName = 'pages/create';
export const pagesCreateContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['pages'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, NAME_ALREADY_EXISTS: { status: 400, data: apiErrorData } })
	.input(pagesCreateInput)
	.output(pagesCreateOutput);
