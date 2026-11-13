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
import { webhookEventTypes } from '../../../webhook-events.schema.js';

export const iWebhooksTestErrors = {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: '0c52149c-e913-18f8-5dc7-74870bfe0cf9',
		},
	} as const;

const requestName = 'i/webhooks/test';
export const iWebhooksTestContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	secure: true,
	kind: 'read:account',
	limit: {
		duration: 900000,
		max: 60,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['webhooks'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_WEBHOOK: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"webhookId": misskeyId,
	"type": v.picklist(webhookEventTypes),
	"override": v.exactOptional(v.pipe(objectInput({
		"url": v.exactOptional(v.string()),
		"secret": v.exactOptional(v.string()),
	}), v.metadata({ "required": undefined }))),
})).output(v.void());
