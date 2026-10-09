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

const requestName = 'sw/unregister';
export const unregisterContract = oc.$meta({
	requestName: requestName,
	limit: { duration: 3600000, max: 30 },
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['account'], description: 'Unregister from receiving push notifications.', successStatus: 204 })
	.errors(commonErrors)
	.input(objectInput({ endpoint: v.string(), auth: v.string(), publickey: v.string() }))
	.output(v.void());
