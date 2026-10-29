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
import { jsonString } from '../../../../../api/backend/transport/string.schema.js';
import { webhookEventTypes } from '../../../webhook-events.schema.js';

export const iWebhooksUpdateErrors = { noSuchWebhook: { message: 'No such webhook.', code: 'NO_SUCH_WEBHOOK', id: 'fb0fea69-da18-45b1-828d-bd4fd1612518' } } as const;

const requestName = 'i/webhooks/update';
export const iWebhooksUpdateContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['webhooks'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_WEBHOOK: { status: 400, data: apiErrorData } })
	.input(objectInput({ webhookId: misskeyId, name: v.exactOptional(jsonString({ minLength: 1, maxLength: 100 })), url: v.exactOptional(jsonString({ minLength: 1, maxLength: 1024 })), secret: v.exactOptional(v.nullable(jsonString({ maxLength: 1024 }))), on: v.exactOptional(v.array(v.picklist(webhookEventTypes))), active: v.exactOptional(v.boolean()) })).output(v.void());
