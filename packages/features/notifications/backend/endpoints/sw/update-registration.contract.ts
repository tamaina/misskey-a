/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';

const requestName = 'sw/update-registration';
export const updateRegistrationContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	secure: true,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['account'], description: 'Update push notification registration.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_REGISTRATION: { status: 400, data: apiErrorData } })
	.input(objectInput({ endpoint: v.string(), sendReadMessage: v.exactOptional(v.boolean()) }))
	.output(v.strictObject({ userId: v.string(), endpoint: v.string(), sendReadMessage: v.boolean() }));
