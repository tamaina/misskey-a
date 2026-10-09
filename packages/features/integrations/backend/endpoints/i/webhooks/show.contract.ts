/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';
import { userWebhookSchema } from '../../../webhook.schema.js';

export const iWebhooksShowErrors = {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: '50f614d9-3047-4f7e-90d8-ad6b2d5fb098',
		},
	} as const;

const requestName = 'i/webhooks/show';
export const iWebhooksShowContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['webhooks'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_WEBHOOK: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"webhookId": misskeyId,
})).output(userWebhookSchema);
