/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
import * as v from 'valibot';
import { packedUserLiteSchema, packedUserDetailedSchema, packedUserDetailedNotMeSchema } from '../../users/backend/user.schema.js';
import { systemWebhookSchema } from '../../integrations/backend/webhook.schema.js';
import { oc, type Meta } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { jsonString } from '../../api/backend/transport/string.schema.js';
import { packedJsonObjectSchema } from '../../users/backend/json-value.schema.js';
import { roleSchema, rolePoliciesSchema } from '../../roles/backend/role.schema.js';
import { notificationSettings } from '../../users/backend/notification-settings.schema.js';

/** Shared by recipient create, show, update, list and packed-model producers. */
export const abuseReportNotificationRecipientSchema = v.strictObject({
	id: v.string(), isActive: v.boolean(), updatedAt: v.string(), name: v.string(), method: v.picklist(['email', 'webhook']),
	userId: v.optional(v.string()), user: v.optional(packedUserLiteSchema),
	systemWebhookId: v.optional(v.string()), systemWebhook: v.optional(systemWebhookSchema),
});

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const moderationContract = {
 adminAbuseReportNotificationRecipientCreate: oc.$meta({
	requestName: 'admin/abuse-report/notification-recipient/create',
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:abuse-report:notification-recipient',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/create', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, CORRELATION_CHECK_EMAIL: { status: 400, data: apiErrorData }, CORRELATION_CHECK_WEBHOOK: { status: 400, data: apiErrorData }, EMAIL_ADDRESS_NOT_SET: { status: 400, data: apiErrorData } }).input(objectInput({
	'isActive': v.boolean(),
	'name': jsonString({ 'minLength': 1, 'maxLength': 255 }),
	'method': v.picklist(['email', 'webhook']),
	'userId': v.exactOptional(misskeyId),
	'systemWebhookId': v.exactOptional(misskeyId),
})).output(abuseReportNotificationRecipientSchema),
 adminAbuseReportNotificationRecipientDelete: oc.$meta({
	requestName: 'admin/abuse-report/notification-recipient/delete',
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:abuse-report:notification-recipient',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/delete', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(objectInput({ id: misskeyId })).output(v.void()),
 adminAbuseReportNotificationRecipientList: oc.$meta({
	requestName: 'admin/abuse-report/notification-recipient/list',
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:abuse-report:notification-recipient',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/list', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(objectInput({
	'method': v.exactOptional(v.array(v.picklist(['email', 'webhook']))),
})).output(v.array(abuseReportNotificationRecipientSchema)),
 adminAbuseReportNotificationRecipientShow: oc.$meta({
	requestName: 'admin/abuse-report/notification-recipient/show',
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:abuse-report:notification-recipient',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/show', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, NO_SUCH_RECIPIENT: { status: 404, data: apiErrorData } }).input(objectInput({
	'id': misskeyId,
})).output(abuseReportNotificationRecipientSchema),
 adminAbuseReportNotificationRecipientUpdate: oc.$meta({
	requestName: 'admin/abuse-report/notification-recipient/update',
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:abuse-report:notification-recipient',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/update', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, CORRELATION_CHECK_EMAIL: { status: 400, data: apiErrorData }, CORRELATION_CHECK_WEBHOOK: { status: 400, data: apiErrorData }, EMAIL_ADDRESS_NOT_SET: { status: 400, data: apiErrorData } }).input(objectInput({
	'id': misskeyId,
	'isActive': v.boolean(),
	'name': jsonString({ 'minLength': 1, 'maxLength': 255 }),
	'method': v.picklist(['email', 'webhook']),
	'userId': v.exactOptional(misskeyId),
	'systemWebhookId': v.exactOptional(misskeyId),
})).output(abuseReportNotificationRecipientSchema),
 adminAbuseUserReports: oc.$meta({
	requestName: 'admin/abuse-user-reports',
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:abuse-user-reports',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/abuse-user-reports', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'state': v.optional(v.nullable(v.string()), null),
	'reporterOrigin': v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
	'targetUserOrigin': v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
})).output(v.array(v.strictObject({
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
}))),
 adminForwardAbuseUserReport: oc.$meta({
	requestName: 'admin/forward-abuse-user-report',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:resolve-abuse-user-report',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/forward-abuse-user-report', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ABUSE_REPORT: { status: 404, data: apiErrorData } }).input(objectInput({ reportId: misskeyId })).output(v.void()),
 adminGetUserIps: oc.$meta({
	requestName: 'admin/get-user-ips',
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:user-ips',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/get-user-ips', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(objectInput({
	'userId': misskeyId,
})).output(v.array(v.strictObject({
	'ip': v.string(),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
}))),
 adminResolveAbuseUserReport: oc.$meta({
	requestName: 'admin/resolve-abuse-user-report',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:resolve-abuse-user-report',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/resolve-abuse-user-report', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ABUSE_REPORT: { status: 404, data: apiErrorData } }).input(objectInput({
	reportId: misskeyId,
	resolvedAs: v.exactOptional(v.nullable(v.picklist(['accept', 'reject']))),
})).output(v.void()),
 adminShowModerationLogs: oc.$meta({
	requestName: 'admin/show-moderation-logs',
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:show-moderation-log',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/show-moderation-logs', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'type': v.exactOptional(v.nullable(v.string())),
	'userId': v.exactOptional(v.nullable(misskeyId)),
	'search': v.exactOptional(v.nullable(v.string())),
})).output(v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'type': v.string(),
	'info': packedJsonObjectSchema,
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': packedUserDetailedNotMeSchema,
}))),
 adminShowUser: oc.$meta({
	requestName: 'admin/show-user',
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-user',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/show-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(objectInput({ userId: misskeyId })).output(v.strictObject({
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
	isRemoteSuspended: v.boolean(),
	isHibernated: v.boolean(),
	lastActiveDate: v.nullable(v.string()),
	moderationNote: v.string(),
	signins: v.array(v.strictObject({ id: v.string(), userId: v.string(), ip: v.string(), headers: packedJsonObjectSchema, success: v.boolean() })),
	policies: rolePoliciesSchema,
	roles: v.array(roleSchema),
	roleAssigns: v.array(v.strictObject({
		createdAt: v.string(),
		expiresAt: v.nullable(v.string()),
		roleId: v.string(),
	})),
})),
 adminShowUsers: oc.$meta({
	requestName: 'admin/show-users',
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-user',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/show-users', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	'sort': v.exactOptional(v.picklist(['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt', '+lastActiveDate', '-lastActiveDate'])),
	'state': v.optional(v.picklist(['all', 'alive', 'available', 'admin', 'moderator', 'adminOrModerator', 'suspended']), 'all'),
	'origin': v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
	'username': v.optional(v.nullable(v.string()), null),
	'hostname': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'The local host is represented with `null`.' })), null),
})).output(v.array(packedUserDetailedSchema)),
 adminSuspendUser: oc.$meta({
	requestName: 'admin/suspend-user',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:suspend-user',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/suspend-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(objectInput({ userId: misskeyId })).output(v.void()),
 adminUnsetUserAvatar: oc.$meta({
	requestName: 'admin/unset-user-avatar',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:unset-user-avatar',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/unset-user-avatar', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(objectInput({ userId: misskeyId })).output(v.void()),
 adminUnsetUserBanner: oc.$meta({
	requestName: 'admin/unset-user-banner',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:unset-user-banner',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/unset-user-banner', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(objectInput({ userId: misskeyId })).output(v.void()),
 adminUnsuspendUser: oc.$meta({
	requestName: 'admin/unsuspend-user',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:unsuspend-user',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/unsuspend-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(objectInput({ userId: misskeyId })).output(v.void()),
 adminUpdateAbuseUserReport: oc.$meta({
	requestName: 'admin/update-abuse-user-report',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:resolve-abuse-user-report',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/update-abuse-user-report', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ABUSE_REPORT: { status: 404, data: apiErrorData } }).input(objectInput({
	reportId: misskeyId,
	moderationNote: v.exactOptional(v.string()),
})).output(v.void()),
 adminUpdateUserNote: oc.$meta({
	requestName: 'admin/update-user-note',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:user-note',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/admin/update-user-note', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(objectInput({ userId: misskeyId, text: v.string() })).output(v.void()),
 usersReportAbuse: oc.$meta({
	requestName: 'users/report-abuse',
	requireCredential: true,
	kind: 'write:report-abuse',
} as const satisfies Meta & ApiProcedureMetadata)
 .route({ method: 'POST', path: '/users/report-abuse', tags: ['users'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, CANNOT_REPORT_YOURSELF: { status: 400, data: apiErrorData }, CANNOT_REPORT_THE_ADMIN: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
	'comment': jsonString({ 'minLength': 1, 'maxLength': 2048 }),
})).output(v.void()),
};
