/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../../input.schema.js';
import { jsonString } from '../../../../../api/backend/transport/string.schema.js';
import { systemWebhookEventTypes } from '../../../webhook-events.schema.js';
import { systemWebhookSchema } from '../../../webhook.schema.js';

export const adminSystemWebhookUpdateInput = objectInput({
	"id": misskeyId,
	"isActive": v.boolean(),
	"name": jsonString({ "minLength": 1, "maxLength": 255 }),
	"on": v.array(v.picklist(systemWebhookEventTypes)),
	"url": jsonString({ "minLength": 1, "maxLength": 1024 }),
	"secret": v.optional(jsonString({ "maxLength": 1024 }), ""),
});
export const adminSystemWebhookUpdateOutput = systemWebhookSchema;
export const adminSystemWebhookUpdateErrors = {} as const;

const requestName = 'admin/system-webhook/update';
export const adminSystemWebhookUpdateContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin', 'system-webhook'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminSystemWebhookUpdateInput).output(adminSystemWebhookUpdateOutput);
