/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminAbuseReportNotificationRecipientCreateInput = v.object({
	"isActive": v.boolean(),
	"name": jsonString({ "minLength": 1, "maxLength": 255 }),
	"method": v.picklist(["email", "webhook"]),
	"userId": v.exactOptional(misskeyId),
	"systemWebhookId": v.exactOptional(misskeyId),
});
export const packedAdminAbuseReportNotificationRecipientCreateOutput = packedReference("AbuseReportNotificationRecipient");
export const packedAdminAbuseReportNotificationRecipientCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/abuse-report/notification-recipient/create", tags: ["admin", "abuse-report", "notification-recipient"] },
	packedAdminAbuseReportNotificationRecipientCreateInput,
	packedAdminAbuseReportNotificationRecipientCreateOutput,
);

export const packedAdminAbuseReportNotificationRecipientListInput = v.object({
	"method": v.exactOptional(v.array(v.picklist(["email", "webhook"]))),
});
export const packedAdminAbuseReportNotificationRecipientListOutput = v.array(packedReference("AbuseReportNotificationRecipient"));
export const packedAdminAbuseReportNotificationRecipientListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/abuse-report/notification-recipient/list", tags: ["admin", "abuse-report", "notification-recipient"] },
	packedAdminAbuseReportNotificationRecipientListInput,
	packedAdminAbuseReportNotificationRecipientListOutput,
);

export const packedAdminAbuseReportNotificationRecipientShowInput = v.object({
	"id": misskeyId,
});
export const packedAdminAbuseReportNotificationRecipientShowOutput = packedReference("AbuseReportNotificationRecipient");
export const packedAdminAbuseReportNotificationRecipientShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/abuse-report/notification-recipient/show", tags: ["admin", "abuse-report", "notification-recipient"] },
	packedAdminAbuseReportNotificationRecipientShowInput,
	packedAdminAbuseReportNotificationRecipientShowOutput,
);

export const packedAdminAbuseReportNotificationRecipientUpdateInput = v.object({
	"id": misskeyId,
	"isActive": v.boolean(),
	"name": jsonString({ "minLength": 1, "maxLength": 255 }),
	"method": v.picklist(["email", "webhook"]),
	"userId": v.exactOptional(misskeyId),
	"systemWebhookId": v.exactOptional(misskeyId),
});
export const packedAdminAbuseReportNotificationRecipientUpdateOutput = packedReference("AbuseReportNotificationRecipient");
export const packedAdminAbuseReportNotificationRecipientUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/abuse-report/notification-recipient/update", tags: ["admin", "abuse-report", "notification-recipient"] },
	packedAdminAbuseReportNotificationRecipientUpdateInput,
	packedAdminAbuseReportNotificationRecipientUpdateOutput,
);

export const packedAdminAbuseUserReportsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"state": v.optional(v.nullable(v.string()), null),
	"reporterOrigin": v.optional(v.picklist(["combined", "local", "remote"]), "combined"),
	"targetUserOrigin": v.optional(v.picklist(["combined", "local", "remote"]), "combined"),
});
export const packedAdminAbuseUserReportsOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"comment": v.string(),
		"resolved": v.pipe(v.boolean(), v.metadata({ "example": false })),
		"reporterId": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"targetUserId": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"assigneeId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
		"reporter": packedReference("UserDetailedNotMe"),
		"targetUser": packedReference("UserDetailedNotMe"),
		"assignee": v.nullable(packedReference("UserDetailedNotMe")),
		"forwarded": v.boolean(),
		"resolvedAs": v.pipe(v.nullable(v.picklist(["accept", "reject"])), v.metadata({ "enum": ["accept", "reject", null] })),
		"moderationNote": v.string(),
	}));
export const packedAdminAbuseUserReportsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/abuse-user-reports", tags: ["admin"] },
	packedAdminAbuseUserReportsInput,
	packedAdminAbuseUserReportsOutput,
);

export const packedAdminShowModerationLogsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"type": v.exactOptional(v.nullable(v.string())),
	"userId": v.exactOptional(v.nullable(misskeyId)),
	"search": v.exactOptional(v.nullable(v.string())),
});
export const packedAdminShowModerationLogsOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"type": v.string(),
		"info": resultObject({}),
		"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"user": packedReference("UserDetailedNotMe"),
	}));
export const packedAdminShowModerationLogsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/show-moderation-logs", tags: ["admin"] },
	packedAdminShowModerationLogsInput,
	packedAdminShowModerationLogsOutput,
);

export const packedAdminShowUsersInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.exactOptional(v.picklist(["+follower", "-follower", "+createdAt", "-createdAt", "+updatedAt", "-updatedAt", "+lastActiveDate", "-lastActiveDate"])),
	"state": v.optional(v.picklist(["all", "alive", "available", "admin", "moderator", "adminOrModerator", "suspended"]), "all"),
	"origin": v.optional(v.picklist(["combined", "local", "remote"]), "combined"),
	"username": v.optional(v.nullable(v.string()), null),
	"hostname": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })), null),
});
export const packedAdminShowUsersOutput = v.array(packedReference("UserDetailed"));
export const packedAdminShowUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/show-users", tags: ["admin"] },
	packedAdminShowUsersInput,
	packedAdminShowUsersOutput,
);

export const packedEndpointDefinitions = {
	"admin/abuse-report/notification-recipient/create": packedAdminAbuseReportNotificationRecipientCreateDefinition,
	"admin/abuse-report/notification-recipient/list": packedAdminAbuseReportNotificationRecipientListDefinition,
	"admin/abuse-report/notification-recipient/show": packedAdminAbuseReportNotificationRecipientShowDefinition,
	"admin/abuse-report/notification-recipient/update": packedAdminAbuseReportNotificationRecipientUpdateDefinition,
	"admin/abuse-user-reports": packedAdminAbuseUserReportsDefinition,
	"admin/show-moderation-logs": packedAdminShowModerationLogsDefinition,
	"admin/show-users": packedAdminShowUsersDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/abuse-report/notification-recipient/create": packedAdminAbuseReportNotificationRecipientCreateDefinition.contract,
	"admin/abuse-report/notification-recipient/list": packedAdminAbuseReportNotificationRecipientListDefinition.contract,
	"admin/abuse-report/notification-recipient/show": packedAdminAbuseReportNotificationRecipientShowDefinition.contract,
	"admin/abuse-report/notification-recipient/update": packedAdminAbuseReportNotificationRecipientUpdateDefinition.contract,
	"admin/abuse-user-reports": packedAdminAbuseUserReportsDefinition.contract,
	"admin/show-moderation-logs": packedAdminShowModerationLogsDefinition.contract,
	"admin/show-users": packedAdminShowUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
