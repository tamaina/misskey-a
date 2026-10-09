/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedUserLiteSchema } from '../../users/backend/user.schema.js';
import { systemWebhookSchema } from '../../integrations/backend/webhook.schema.js';

/** Shared by recipient create, show, update, list and packed-model producers. */
export const abuseReportNotificationRecipientSchema = v.strictObject({
	id: v.string(), isActive: v.boolean(), updatedAt: v.string(), name: v.string(), method: v.picklist(['email', 'webhook']),
	userId: v.optional(v.string()), user: v.optional(packedUserLiteSchema),
	systemWebhookId: v.optional(v.string()), systemWebhook: v.optional(systemWebhookSchema),
});
