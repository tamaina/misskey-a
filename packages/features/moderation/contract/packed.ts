/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import {
	packedSystemWebhookSchema as __ref_SystemWebhook
} from '../../integrations/contract/packed.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

export const packedAbuseReportNotificationRecipientSchema = resultObject({
	"id": v.string(),
	"isActive": v.boolean(),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"name": v.string(),
	"method": v.picklist(["email", "webhook"]),
	"userId": v.optional(v.string()),
	"user": v.optional(v.lazy(() => __ref_UserLite)),
	"systemWebhookId": v.optional(v.string()),
	"systemWebhook": v.optional(v.lazy(() => __ref_SystemWebhook))
});
