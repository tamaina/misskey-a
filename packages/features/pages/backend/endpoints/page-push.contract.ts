/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { packedJsonValueSchema, type PackedJsonValue } from '../../../users/backend/json-value.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export interface PagePushInput { pageId: string; event: string; var?: PackedJsonValue }
export const pagePushInput: v.GenericSchema<PagePushInput, PagePushInput> = objectInput({
	"pageId": misskeyId,
	"event": v.string(),
	"var": v.exactOptional(packedJsonValueSchema),
});
export const pagePushOutput = v.void();
export const pagePushErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: '4a13ad31-6729-46b4-b9af-e86b265c2e74' },
} as const;

const requestName = 'page-push';
export const pagePushContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData } })
	.input(pagePushInput)
	.output(pagePushOutput);
