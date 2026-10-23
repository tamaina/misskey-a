/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedJsonObjectSchema } from '../../../../users/backend/json-value.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { jsonString } from '../../../../api/backend/transport/string.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const pagesUpdateErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: '21149b9e-3616-4778-9592-c4ce89f5a864' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '3c15cd52-3b4b-4274-967d-6456fc4f792b' },
	noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'cfc23c7c-3887-490e-af30-0ed576703c82' },
	nameAlreadyExists: { message: 'Specified name already exists.', code: 'NAME_ALREADY_EXISTS', id: '2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab' },
} as const;

const requestName = 'pages/update';
export const pagesUpdateContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:pages',
	prohibitMoved: true,
	limit: { duration: 3_600_000, max: 300 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['pages'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, NAME_ALREADY_EXISTS: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"pageId": misskeyId,
		"title": v.exactOptional(v.string()),
		"name": v.exactOptional(jsonString({
			minLength: 1,
			pattern: /^[^\s:\/?#\[\]@!$&'()*+,;=\\%\x00-\x20]{1,256}$/.source,
		})),
		"summary": v.exactOptional(v.nullable(v.string())),
		"content": v.exactOptional(v.array(packedJsonObjectSchema)),
		"variables": v.exactOptional(v.array(packedJsonObjectSchema)),
		"script": v.exactOptional(v.string()),
		"eyeCatchingImageId": v.exactOptional(v.nullable(misskeyId)),
		"font": v.exactOptional(v.picklist(["serif", "sans-serif"])),
		"alignCenter": v.exactOptional(v.boolean()),
		"hideTitleWhenPinned": v.exactOptional(v.boolean()),
	}))
	.output(v.void());
