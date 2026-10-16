/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';

export const adminSystemWebhookDeleteErrors = {} as const;

const requestName = 'admin/system-webhook/delete';
export const adminSystemWebhookDeleteContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin', 'system-webhook'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	"id": misskeyId,
})).output(v.void());
