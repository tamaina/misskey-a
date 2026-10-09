/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';

const requestName = 'sw/update-registration';
export const updateRegistrationContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account'], description: 'Update push notification registration.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_REGISTRATION: { status: 400, data: apiErrorData } })
	.input(objectInput({ endpoint: v.string(), sendReadMessage: v.exactOptional(v.boolean()) }))
	.output(v.strictObject({ userId: v.string(), endpoint: v.string(), sendReadMessage: v.boolean() }));
