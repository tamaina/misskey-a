/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const reversiSurrenderErrors = {
	noSuchGame: { message: 'No such game.', code: 'NO_SUCH_GAME', id: 'ace0b11f-e0a6-4076-a30d-e8284c81b2df' },
	alreadyEnded: { message: 'That game has already ended.', code: 'ALREADY_ENDED', id: '6c2ad4a6-cbf1-4a5b-b187-b772826cfc6d' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '6e04164b-a992-4c93-8489-2123069973e1' },
} as const;

const requestName = 'reversi/surrender';
export const reversiSurrenderContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_GAME: { status: 400, data: apiErrorData }, ALREADY_ENDED: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"gameId": misskeyId,
	}))
	.output(v.void());
