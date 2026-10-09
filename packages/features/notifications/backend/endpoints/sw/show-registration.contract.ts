/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

export const showRegistrationInput = objectInput({ endpoint: v.string() });
export const showRegistrationOutput = v.nullable(v.strictObject({ userId: v.string(), endpoint: v.string(), sendReadMessage: v.boolean() }));
const requestName = 'sw/show-registration';
export const showRegistrationContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account'], description: 'Check push notification registration exists.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(showRegistrationInput)
	.output(showRegistrationOutput);
