/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';

export const driveInput = objectInput({});
export const driveErrors = {} as const;
export const driveContract = oc.$meta<{ requestName: 'drive' }>({ requestName: 'drive' })
	.route({ method: 'POST', path: '/drive', operationId: 'post___drive', tags: ['drive', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(driveInput).output(v.strictObject({
	"capacity": v.pipe(v.number(), v.finite()),
	"usage": v.pipe(v.number(), v.finite()),
}));
