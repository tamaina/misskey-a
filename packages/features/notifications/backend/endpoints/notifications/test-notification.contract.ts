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

const requestName = 'notifications/test-notification';
export const testNotificationContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:notifications',
	limit: { duration: 60000, max: 10 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['notifications'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors(commonErrors)
	.input(v.optional(v.lazy(input => Array.isArray(input) ? v.never() : objectInput({})), {}))
	.output(v.void());
