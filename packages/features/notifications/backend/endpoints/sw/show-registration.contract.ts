/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

const requestName = 'sw/show-registration';
export const showRegistrationContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	secure: true,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['account'], description: 'Check push notification registration exists.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(objectInput({ endpoint: v.string() }))
	.output(v.nullable(v.strictObject({ userId: v.string(), endpoint: v.string(), sendReadMessage: v.boolean() })));
