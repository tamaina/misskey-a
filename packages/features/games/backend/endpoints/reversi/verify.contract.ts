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

export const reversiVerifyErrors = {
	noSuchGame: { message: 'No such game.', code: 'NO_SUCH_GAME', id: '8fb05624-b525-43dd-90f7-511852bdfeee' },
} as const;

const requestName = 'reversi/verify';
export const reversiVerifyContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], })
	.errors({ ...commonErrors, NO_SUCH_GAME: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"gameId": misskeyId,
		"crc32": v.string(),
	}))
	.output(v.strictObject({
		"desynced": v.boolean(),
		"game": v.exactOptional(v.nullable(packedReversiGameDetailedSchema)),
	}));
