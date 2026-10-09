/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';

const requestName = 'sw/register';
export const registerContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account'], description: 'Register to receive push notifications.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, INVALID_ENDPOINT: { status: 400, data: apiErrorData } })
	.input(objectInput({ endpoint: v.string(), auth: v.string(), publickey: v.string(), sendReadMessage: v.optional(v.boolean(), false) }))
	.output(v.strictObject({ state: v.picklist(['already-subscribed', 'subscribed']), key: v.nullable(v.string()), userId: v.string(), endpoint: v.string(), sendReadMessage: v.boolean() }));
