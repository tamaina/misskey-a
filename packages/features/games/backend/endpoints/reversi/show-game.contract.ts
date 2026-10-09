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

export const reversiShowGameErrors = {
	noSuchGame: { message: 'No such game.', code: 'NO_SUCH_GAME', id: 'f13a03db-fae1-46c9-87f3-43c8165419e1' },
} as const;

const requestName = 'reversi/show-game';
export const reversiShowGameContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], })
	.errors({ ...commonErrors, NO_SUCH_GAME: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"gameId": misskeyId,
	}))
	.output(packedReversiGameDetailedSchema);
