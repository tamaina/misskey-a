/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { systemWebhookEventTypes } from '../../../webhook-events.schema.js';
import { systemWebhookSchema } from '../../../webhook.schema.js';

export const adminSystemWebhookListErrors = {} as const;

const requestName = 'admin/system-webhook/list';
export const adminSystemWebhookListContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin', 'system-webhook'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	"isActive": v.exactOptional(v.boolean()),
	"on": v.exactOptional(v.array(v.picklist(systemWebhookEventTypes))),
})).output(v.array(systemWebhookSchema));
