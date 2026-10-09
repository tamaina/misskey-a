/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../users.input.schema.js';

export const voidIDeleteAccountInput = objectInput({
	'password': v.string(),
	'token': v.exactOptional(v.nullable(v.string())),
});
export const iDeleteAccountErrors = {} as const;
export const iDeleteAccountContract = oc.$meta<{ requestName: 'i/delete-account' }>({ requestName: 'i/delete-account' })
	.route({ method: 'POST', path: '/i/delete-account', operationId: 'post___i___delete-account', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(voidIDeleteAccountInput).output(v.void());
