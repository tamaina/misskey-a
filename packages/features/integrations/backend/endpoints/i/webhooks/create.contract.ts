/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { jsonString } from '../../../../../api/backend/transport/string.schema.js';
import { webhookEventTypes } from '../../../webhook-events.schema.js';
import { finiteNumber } from '../../../webhook.schema.js';

export const iWebhooksCreateErrors = {
		tooManyWebhooks: {
			message: 'You cannot create webhook any more.',
			code: 'TOO_MANY_WEBHOOKS',
			id: '87a9bb19-111e-4e37-81d3-a3e7426453b0',
		},
	} as const;

const requestName = 'i/webhooks/create';
export const iWebhooksCreateContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['webhooks'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, TOO_MANY_WEBHOOKS: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
	"url": jsonString({ "minLength": 1, "maxLength": 1024 }),
	"secret": v.optional(jsonString({ "maxLength": 1024 }), ""),
	"on": v.array(v.picklist(webhookEventTypes)),
})).output(v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"name": v.string(),
	"on": v.array(v.picklist(webhookEventTypes)),
	"url": v.string(),
	"secret": v.string(),
	"active": v.boolean(),
	"latestSentAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestStatus": v.nullable(v.pipe(finiteNumber, v.integer())),
}));
