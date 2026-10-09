/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedPageSchema } from '../../../../users/backend/page.schema.js';
import { packedJsonValueSchema, type PackedJsonValue } from '../../../../users/backend/json-value.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

/** The name branch retains a competing page ID as JSON for the original lookup precedence. */
export type PagesShowSelector =
	| { pageId: string }
	| { name: string; username: string; pageId?: PackedJsonValue };
export const pagesShowInput: v.GenericSchema<PagesShowSelector, PagesShowSelector> = v.union([
	objectInput({
		pageId: misskeyId,
	}),
	objectInput({
		name: v.string(),
		username: v.string(),
		pageId: v.exactOptional(packedJsonValueSchema),
	}),
]);
export const pagesShowOutput = packedPageSchema;
export const pagesShowErrors = {
	noSuchPage: { message: 'No such page.', code: 'NO_SUCH_PAGE', id: '222120c0-3ead-4528-811b-b96f233388d7' },
} as const;

const requestName = 'pages/show';
export const pagesShowContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['pages'], })
	.errors({ ...commonErrors, NO_SUCH_PAGE: { status: 400, data: apiErrorData } })
	.input(pagesShowInput)
	.output(pagesShowOutput);
