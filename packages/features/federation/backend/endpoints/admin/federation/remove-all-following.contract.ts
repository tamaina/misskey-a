/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminFederationRemoveAllFollowingErrors = {} as const;

const requestName = 'admin/federation/remove-all-following';
export const adminFederationRemoveAllFollowingContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"host": v.string(),
	})).output(v.void());

export type AdminFederationRemoveAllFollowingInput = v.InferOutput<NonNullable<typeof adminFederationRemoveAllFollowingContract['~orpc']['inputSchema']>>;
export type AdminFederationRemoveAllFollowingOutput = v.InferOutput<NonNullable<typeof adminFederationRemoveAllFollowingContract['~orpc']['outputSchema']>>;
