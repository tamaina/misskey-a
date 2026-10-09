/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userWebhookSchema } from '../../../webhook.schema.js';

export const iWebhooksListInput = objectInput({});
export const iWebhooksListOutput = v.array(userWebhookSchema);
export const iWebhooksListErrors = {} as const;

const requestName = 'i/webhooks/list';
export const iWebhooksListContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['webhooks', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(iWebhooksListInput).output(iWebhooksListOutput);
