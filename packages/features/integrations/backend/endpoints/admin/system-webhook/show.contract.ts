/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';
import { systemWebhookSchema } from '../../../webhook.schema.js';

export const adminSystemWebhookShowInput = objectInput({
	"id": misskeyId,
});
export const adminSystemWebhookShowOutput = systemWebhookSchema;
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
export const adminSystemWebhookShowContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin', 'system-webhook'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_SYSTEM_WEBHOOK: { status: 404, data: apiErrorData } })
	.input(adminSystemWebhookShowInput).output(adminSystemWebhookShowOutput);
