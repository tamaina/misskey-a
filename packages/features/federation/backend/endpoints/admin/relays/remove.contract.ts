/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminRelaysRemoveErrors = {} as const;

const requestName = 'admin/relays/remove';
export const adminRelaysRemoveContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"inbox": v.string(),
	})).output(v.void());

export type AdminRelaysRemoveInput = v.InferOutput<NonNullable<typeof adminRelaysRemoveContract['~orpc']['inputSchema']>>;
export type AdminRelaysRemoveOutput = v.InferOutput<NonNullable<typeof adminRelaysRemoveContract['~orpc']['outputSchema']>>;
