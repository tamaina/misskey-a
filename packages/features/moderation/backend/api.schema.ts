/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { jsonString } from '../../api/backend/transport/string.schema.js';
import { packedUserLiteSchema, packedUserDetailedSchema, packedUserDetailedNotMeSchema } from '../../users/backend/user.schema.js';
import { packedJsonObjectSchema } from '../../users/backend/json-value.schema.js';
import { roleSchema, rolePoliciesSchema } from '../../roles/backend/role.schema.js';
import { systemWebhookSchema } from '../../integrations/backend/webhook.schema.js';
import { notificationSettings } from '../../users/backend/notification-settings.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
const recipientSchema = v.strictObject({
	id: v.string(), isActive: v.boolean(), updatedAt: v.string(), name: v.string(), method: v.picklist(['email', 'webhook']),
	userId: v.optional(v.string()), user: v.optional(packedUserLiteSchema),
	systemWebhookId: v.optional(v.string()), systemWebhook: v.optional(systemWebhookSchema),
});
const adminSigninSchema = v.strictObject({ id: v.string(), userId: v.string(), ip: v.string(), headers: packedJsonObjectSchema, success: v.boolean() });
export const adminAbuseReportNotificationRecipientCreateInput = objectInput({
	'isActive': v.boolean(),
	'name': jsonString({ 'minLength': 1, 'maxLength': 255 }),
	'method': v.picklist(['email', 'webhook']),
	'userId': v.exactOptional(misskeyId),
	'systemWebhookId': v.exactOptional(misskeyId),
});
export const adminAbuseReportNotificationRecipientCreateOutput = recipientSchema;

export const adminAbuseReportNotificationRecipientDeleteInput = objectInput({ id: misskeyId });
export const adminAbuseReportNotificationRecipientDeleteOutput = v.void();

export const adminAbuseReportNotificationRecipientListInput = objectInput({
	'method': v.exactOptional(v.array(v.picklist(['email', 'webhook']))),
});
export const adminAbuseReportNotificationRecipientListOutput = v.array(recipientSchema);

export const adminAbuseReportNotificationRecipientShowInput = objectInput({
	'id': misskeyId,
});
export const adminAbuseReportNotificationRecipientShowOutput = recipientSchema;

export const adminAbuseReportNotificationRecipientUpdateInput = objectInput({
	'id': misskeyId,
	'isActive': v.boolean(),
	'name': jsonString({ 'minLength': 1, 'maxLength': 255 }),
	'method': v.picklist(['email', 'webhook']),
	'userId': v.exactOptional(misskeyId),
	'systemWebhookId': v.exactOptional(misskeyId),
});
export const adminAbuseReportNotificationRecipientUpdateOutput = recipientSchema;

export const adminAbuseUserReportsInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'state': v.optional(v.nullable(v.string()), null),
	'reporterOrigin': v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
	'targetUserOrigin': v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
});
export const adminAbuseUserReportsOutput = v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'comment': v.string(),
	'resolved': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'reporterId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'targetUserId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'assigneeId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'reporter': packedUserDetailedNotMeSchema,
	'targetUser': packedUserDetailedNotMeSchema,
	'assignee': v.nullable(packedUserDetailedNotMeSchema),
	'forwarded': v.boolean(),
	'resolvedAs': v.pipe(v.nullable(v.picklist(['accept', 'reject'])), v.metadata({ 'enum': ['accept', 'reject', null] })),
	'moderationNote': v.string(),
}));

export const adminForwardAbuseUserReportInput = objectInput({ reportId: misskeyId });
export const adminForwardAbuseUserReportOutput = v.void();

export const adminGetUserIpsInput = objectInput({
	'userId': misskeyId,
});
export const adminGetUserIpsOutput = v.array(v.strictObject({
	'ip': v.string(),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
}));

export const adminResolveAbuseUserReportInput = objectInput({
	reportId: misskeyId,
	resolvedAs: v.exactOptional(v.nullable(v.picklist(['accept', 'reject']))),
});
export const adminResolveAbuseUserReportOutput = v.void();

export const adminShowModerationLogsInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'type': v.exactOptional(v.nullable(v.string())),
	'userId': v.exactOptional(v.nullable(misskeyId)),
	'search': v.exactOptional(v.nullable(v.string())),
});
export const adminShowModerationLogsOutput = v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'type': v.string(),
	'info': packedJsonObjectSchema,
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': packedUserDetailedNotMeSchema,
}));

export const adminShowUserInput = objectInput({ userId: misskeyId });
export const adminShowUserOutput = v.strictObject({
	email: v.nullable(v.string()),
	emailVerified: v.boolean(),
	followedMessage: v.nullable(v.string()),
	autoAcceptFollowed: v.boolean(),
	noCrawle: v.boolean(),
	preventAiLearning: v.boolean(),
	alwaysMarkNsfw: v.boolean(),
	autoSensitive: v.boolean(),
	carefulBot: v.boolean(),
	injectFeaturedNote: v.boolean(),
	receiveAnnouncementEmail: v.boolean(),
	mutedWords: v.array(v.union([v.string(), v.array(v.string())])),
	mutedInstances: v.array(v.string()),
	notificationRecieveConfig: notificationSettings,
	isModerator: v.boolean(),
	isSilenced: v.boolean(),
	isSuspended: v.boolean(),
	isHibernated: v.boolean(),
	lastActiveDate: v.nullable(v.string()),
	moderationNote: v.string(),
	signins: v.array(adminSigninSchema),
	policies: rolePoliciesSchema,
	roles: v.array(roleSchema),
	roleAssigns: v.array(v.strictObject({
		createdAt: v.string(),
		expiresAt: v.nullable(v.string()),
		roleId: v.string(),
	})),
});

export const adminShowUsersInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	'sort': v.exactOptional(v.picklist(['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt', '+lastActiveDate', '-lastActiveDate'])),
	'state': v.optional(v.picklist(['all', 'alive', 'available', 'admin', 'moderator', 'adminOrModerator', 'suspended']), 'all'),
	'origin': v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
	'username': v.optional(v.nullable(v.string()), null),
	'hostname': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'The local host is represented with `null`.' })), null),
});
export const adminShowUsersOutput = v.array(packedUserDetailedSchema);

export const adminSuspendUserInput = objectInput({ userId: misskeyId });
export const adminSuspendUserOutput = v.void();

export const adminUnsetUserAvatarInput = objectInput({ userId: misskeyId });
export const adminUnsetUserAvatarOutput = v.void();

export const adminUnsetUserBannerInput = objectInput({ userId: misskeyId });
export const adminUnsetUserBannerOutput = v.void();

export const adminUnsuspendUserInput = objectInput({ userId: misskeyId });
export const adminUnsuspendUserOutput = v.void();

export const adminUpdateAbuseUserReportInput = objectInput({
	reportId: misskeyId,
	moderationNote: v.exactOptional(v.string()),
});
export const adminUpdateAbuseUserReportOutput = v.void();

export const adminUpdateUserNoteInput = objectInput({ userId: misskeyId, text: v.string() });
export const adminUpdateUserNoteOutput = v.void();

export const usersReportAbuseInput = objectInput({
	'userId': misskeyId,
	'comment': jsonString({ 'minLength': 1, 'maxLength': 2048 }),
});
export const usersReportAbuseOutput = v.void();

export const moderationInputs = {
	adminAbuseReportNotificationRecipientCreate: adminAbuseReportNotificationRecipientCreateInput,
	adminAbuseReportNotificationRecipientDelete: adminAbuseReportNotificationRecipientDeleteInput,
	adminAbuseReportNotificationRecipientList: adminAbuseReportNotificationRecipientListInput,
	adminAbuseReportNotificationRecipientShow: adminAbuseReportNotificationRecipientShowInput,
	adminAbuseReportNotificationRecipientUpdate: adminAbuseReportNotificationRecipientUpdateInput,
	adminAbuseUserReports: adminAbuseUserReportsInput,
	adminForwardAbuseUserReport: adminForwardAbuseUserReportInput,
	adminGetUserIps: adminGetUserIpsInput,
	adminResolveAbuseUserReport: adminResolveAbuseUserReportInput,
	adminShowModerationLogs: adminShowModerationLogsInput,
	adminShowUser: adminShowUserInput,
	adminShowUsers: adminShowUsersInput,
	adminSuspendUser: adminSuspendUserInput,
	adminUnsetUserAvatar: adminUnsetUserAvatarInput,
	adminUnsetUserBanner: adminUnsetUserBannerInput,
	adminUnsuspendUser: adminUnsuspendUserInput,
	adminUpdateAbuseUserReport: adminUpdateAbuseUserReportInput,
	adminUpdateUserNote: adminUpdateUserNoteInput,
	usersReportAbuse: usersReportAbuseInput,
};
export const moderationOutputs = {
	adminAbuseReportNotificationRecipientCreate: adminAbuseReportNotificationRecipientCreateOutput,
	adminAbuseReportNotificationRecipientDelete: adminAbuseReportNotificationRecipientDeleteOutput,
	adminAbuseReportNotificationRecipientList: adminAbuseReportNotificationRecipientListOutput,
	adminAbuseReportNotificationRecipientShow: adminAbuseReportNotificationRecipientShowOutput,
	adminAbuseReportNotificationRecipientUpdate: adminAbuseReportNotificationRecipientUpdateOutput,
	adminAbuseUserReports: adminAbuseUserReportsOutput,
	adminForwardAbuseUserReport: adminForwardAbuseUserReportOutput,
	adminGetUserIps: adminGetUserIpsOutput,
	adminResolveAbuseUserReport: adminResolveAbuseUserReportOutput,
	adminShowModerationLogs: adminShowModerationLogsOutput,
	adminShowUser: adminShowUserOutput,
	adminShowUsers: adminShowUsersOutput,
	adminSuspendUser: adminSuspendUserOutput,
	adminUnsetUserAvatar: adminUnsetUserAvatarOutput,
	adminUnsetUserBanner: adminUnsetUserBannerOutput,
	adminUnsuspendUser: adminUnsuspendUserOutput,
	adminUpdateAbuseUserReport: adminUpdateAbuseUserReportOutput,
	adminUpdateUserNote: adminUpdateUserNoteOutput,
	usersReportAbuse: usersReportAbuseOutput,
};
