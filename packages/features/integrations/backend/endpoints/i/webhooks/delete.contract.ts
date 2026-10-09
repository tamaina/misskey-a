/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';

export const iWebhooksDeleteInput = objectInput({ webhookId: misskeyId });
export const iWebhooksDeleteOutput = v.void();
export const iWebhooksDeleteErrors = { noSuchWebhook: { message: 'No such webhook.', code: 'NO_SUCH_WEBHOOK', id: 'bae73e5a-5522-4965-ae19-3a8688e71d82' } } as const;

const requestName = 'i/webhooks/delete';
export const iWebhooksDeleteContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['webhooks'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_WEBHOOK: { status: 400, data: apiErrorData } })
	.input(iWebhooksDeleteInput).output(iWebhooksDeleteOutput);
