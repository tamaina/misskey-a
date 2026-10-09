/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';

export const updateRegistrationInput = objectInput({ endpoint: v.string(), sendReadMessage: v.exactOptional(v.boolean()) });
export const updateRegistrationOutput = v.strictObject({ userId: v.string(), endpoint: v.string(), sendReadMessage: v.boolean() });
const requestName = 'sw/update-registration';
export const updateRegistrationContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account'], description: 'Update push notification registration.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors({ ...commonErrors, NO_SUCH_REGISTRATION: { status: 400, data: apiErrorData } })
	.input(updateRegistrationInput)
	.output(updateRegistrationOutput);
