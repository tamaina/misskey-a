/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const reversiCancelMatchInput = objectInput({
	"userId": v.exactOptional(v.nullable(misskeyId)),
});
export const reversiCancelMatchOutput = v.void();

const requestName = 'reversi/cancel-match';
export const reversiCancelMatchContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors(commonErrors)
	.input(reversiCancelMatchInput)
	.output(reversiCancelMatchOutput);
