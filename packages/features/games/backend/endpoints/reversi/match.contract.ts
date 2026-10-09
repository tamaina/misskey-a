/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedReversiGameDetailedSchema } from '../../reversi.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const reversiMatchErrors = {
	noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '0b4f0559-b484-4e31-9581-3f73cee89b28' },
	isYourself: { message: 'Target user is yourself.', code: 'TARGET_IS_YOURSELF', id: '96fd7bd6-d2bc-426c-a865-d055dcd2828e' },
} as const;

const requestName = 'reversi/match';
export const reversiMatchContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, TARGET_IS_YOURSELF: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"userId": v.exactOptional(v.nullable(misskeyId)),
		"noIrregularRules": v.optional(v.boolean(), false),
		"multiple": v.optional(v.boolean(), false),
	}))
	.output(v.optional(packedReversiGameDetailedSchema));
