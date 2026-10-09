/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../users.input.schema.js';

export const voidAdminDeleteAccountInput = objectInput({
	'userId': misskeyId,
});
export const adminDeleteAccountErrors = {} as const;
export const adminDeleteAccountContract = oc.$meta<{ requestName: 'admin/delete-account' }>({ requestName: 'admin/delete-account' })
	.route({ method: 'POST', path: '/admin/delete-account', operationId: 'post___admin___delete-account', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(voidAdminDeleteAccountInput).output(v.void());
