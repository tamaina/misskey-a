/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';
import { systemWebhookEventTypes } from '../../../webhook-events.schema.js';

export const adminSystemWebhookTestErrors = {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: '0c52149c-e913-18f8-5dc7-74870bfe0cf9',
		},
	} as const;

const requestName = 'admin/system-webhook/test';
export const adminSystemWebhookTestContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['webhooks'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_WEBHOOK: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"webhookId": misskeyId,
	"type": v.picklist(systemWebhookEventTypes),
	"override": v.exactOptional(v.pipe(objectInput({
		"url": v.exactOptional(v.pipe(v.string(), v.metadata({ "nullable": false }))),
		"secret": v.exactOptional(v.pipe(v.string(), v.metadata({ "nullable": false }))),
	}), v.metadata({ "required": undefined }))),
})).output(v.void());
