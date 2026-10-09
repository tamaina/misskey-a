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

export const antennasUpdateInput = objectInput({
	'antennaId': misskeyId,
	'name': v.exactOptional(antennaName),
	'src': v.exactOptional(v.picklist(['home', 'all', 'users', 'list', 'users_blacklist'])),
	'userListId': v.exactOptional(v.nullable(misskeyId)),
	'keywords': v.exactOptional(v.array(v.array(v.string()))),
	'excludeKeywords': v.exactOptional(v.array(v.array(v.string()))),
	'users': v.exactOptional(v.array(v.string())),
	'caseSensitive': v.exactOptional(v.boolean()),
	'localOnly': v.exactOptional(v.boolean()),
	'excludeBots': v.exactOptional(v.boolean()),
	'withReplies': v.exactOptional(v.boolean()),
	'withFile': v.exactOptional(v.boolean()),
	'excludeNotesInSensitiveChannel': v.exactOptional(v.boolean()),
});
export const antennasUpdateOutput = packedAntennaSchema;
export const antennasUpdateErrors = {
	noSuchAntenna: { message: 'No such antenna.', code: 'NO_SUCH_ANTENNA', id: '10c673ac-8852-48eb-aa1f-f5b67f069290' },
	noSuchUserList: { message: 'No such user list.', code: 'NO_SUCH_USER_LIST', id: '1c6b35c9-943e-48c2-81e4-2844989407f7' },
	emptyKeyword: { message: 'Either keywords or excludeKeywords is required.', code: 'EMPTY_KEYWORD', id: '721aaff6-4e1b-4d88-8de6-877fae9f68c4' },
} as const;

const requestName = 'antennas/update';
export const antennasUpdateContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['antennas'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_ANTENNA: { status: 400, data: apiErrorData }, NO_SUCH_USER_LIST: { status: 400, data: apiErrorData }, EMPTY_KEYWORD: { status: 400, data: apiErrorData } })
	.input(antennasUpdateInput)
	.output(antennasUpdateOutput);
