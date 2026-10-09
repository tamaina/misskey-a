/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../users.input.schema.js';

export const voidAdminAccountsDeleteInput = objectInput({
	'userId': misskeyId,
});
export const adminAccountsDeleteErrors = {} as const;
export const adminAccountsDeleteContract = oc.$meta<{ requestName: 'admin/accounts/delete' }>({ requestName: 'admin/accounts/delete' })
	.route({ method: 'POST', path: '/admin/accounts/delete', operationId: 'post___admin___accounts___delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(voidAdminAccountsDeleteInput).output(v.void());
