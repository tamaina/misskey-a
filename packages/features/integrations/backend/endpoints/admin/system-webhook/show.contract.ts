/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';
import { systemWebhookSchema } from '../../../webhook.schema.js';

export const adminSystemWebhookShowErrors = {
		noSuchSystemWebhook: {
			message: 'No such SystemWebhook.',
			code: 'NO_SUCH_SYSTEM_WEBHOOK',
			id: '38dd1ffe-04b4-6ff5-d8ba-4e6a6ae22c9d',
			kind: 'server',
			status: 404,
		},
	} as const;

const requestName = 'admin/system-webhook/show';
export const adminSystemWebhookShowContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin', 'system-webhook'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_SYSTEM_WEBHOOK: { status: 404, data: apiErrorData } })
	.input(objectInput({
	"id": misskeyId,
})).output(systemWebhookSchema);
