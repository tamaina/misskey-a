/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId, antennaName } from '../input.schema.js';
import { packedAntennaSchema } from '../../antenna.schema.js';

export const antennasCreateInput = objectInput({
	'name': antennaName,
	'src': v.picklist(['home', 'all', 'users', 'list', 'users_blacklist']),
	'userListId': v.exactOptional(v.nullable(misskeyId)),
	'keywords': v.array(v.array(v.string())),
	'excludeKeywords': v.array(v.array(v.string())),
	'users': v.array(v.string()),
	'caseSensitive': v.boolean(),
	'localOnly': v.exactOptional(v.boolean()),
	'excludeBots': v.exactOptional(v.boolean()),
	'withReplies': v.boolean(),
	'withFile': v.boolean(),
	'excludeNotesInSensitiveChannel': v.exactOptional(v.boolean()),
});
export const antennasCreateOutput = packedAntennaSchema;
export const antennasCreateErrors = {
	noSuchUserList: { message: 'No such user list.', code: 'NO_SUCH_USER_LIST', id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f' },
	tooManyAntennas: { message: 'You cannot create antenna any more.', code: 'TOO_MANY_ANTENNAS', id: 'faf47050-e8b5-438c-913c-db2b1576fde4' },
	emptyKeyword: { message: 'Either keywords or excludeKeywords is required.', code: 'EMPTY_KEYWORD', id: '53ee222e-1ddd-4f9a-92e5-9fb82ddb463a' },
} as const;

const requestName = 'antennas/create';
export const antennasCreateContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['antennas'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_USER_LIST: { status: 400, data: apiErrorData }, TOO_MANY_ANTENNAS: { status: 400, data: apiErrorData }, EMPTY_KEYWORD: { status: 400, data: apiErrorData } })
	.input(antennasCreateInput)
	.output(antennasCreateOutput);
