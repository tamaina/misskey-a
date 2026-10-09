/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { moderationInputs, moderationOutputs } from './api.schema.js';
const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const moderationContract = {
 adminAbuseReportNotificationRecipientCreate: oc.$meta<{ requestName: 'admin/abuse-report/notification-recipient/create' }>({ requestName: 'admin/abuse-report/notification-recipient/create' })
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/create', operationId: 'post___admin___abuse-report___notification-recipient___create', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, CORRELATION_CHECK_EMAIL: { status: 400, data: apiErrorData }, CORRELATION_CHECK_WEBHOOK: { status: 400, data: apiErrorData }, EMAIL_ADDRESS_NOT_SET: { status: 400, data: apiErrorData } }).input(moderationInputs.adminAbuseReportNotificationRecipientCreate).output(moderationOutputs.adminAbuseReportNotificationRecipientCreate),
 adminAbuseReportNotificationRecipientDelete: oc.$meta<{ requestName: 'admin/abuse-report/notification-recipient/delete' }>({ requestName: 'admin/abuse-report/notification-recipient/delete' })
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/delete', operationId: 'post___admin___abuse-report___notification-recipient___delete', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(moderationInputs.adminAbuseReportNotificationRecipientDelete).output(moderationOutputs.adminAbuseReportNotificationRecipientDelete),
 adminAbuseReportNotificationRecipientList: oc.$meta<{ requestName: 'admin/abuse-report/notification-recipient/list' }>({ requestName: 'admin/abuse-report/notification-recipient/list' })
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/list', operationId: 'post___admin___abuse-report___notification-recipient___list', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(moderationInputs.adminAbuseReportNotificationRecipientList).output(moderationOutputs.adminAbuseReportNotificationRecipientList),
 adminAbuseReportNotificationRecipientShow: oc.$meta<{ requestName: 'admin/abuse-report/notification-recipient/show' }>({ requestName: 'admin/abuse-report/notification-recipient/show' })
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/show', operationId: 'post___admin___abuse-report___notification-recipient___show', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, NO_SUCH_RECIPIENT: { status: 404, data: apiErrorData } }).input(moderationInputs.adminAbuseReportNotificationRecipientShow).output(moderationOutputs.adminAbuseReportNotificationRecipientShow),
 adminAbuseReportNotificationRecipientUpdate: oc.$meta<{ requestName: 'admin/abuse-report/notification-recipient/update' }>({ requestName: 'admin/abuse-report/notification-recipient/update' })
 .route({ method: 'POST', path: '/admin/abuse-report/notification-recipient/update', operationId: 'post___admin___abuse-report___notification-recipient___update', tags: ['admin', 'abuse-report', 'notification-recipient'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, CORRELATION_CHECK_EMAIL: { status: 400, data: apiErrorData }, CORRELATION_CHECK_WEBHOOK: { status: 400, data: apiErrorData }, EMAIL_ADDRESS_NOT_SET: { status: 400, data: apiErrorData } }).input(moderationInputs.adminAbuseReportNotificationRecipientUpdate).output(moderationOutputs.adminAbuseReportNotificationRecipientUpdate),
 adminAbuseUserReports: oc.$meta<{ requestName: 'admin/abuse-user-reports' }>({ requestName: 'admin/abuse-user-reports' })
 .route({ method: 'POST', path: '/admin/abuse-user-reports', operationId: 'post___admin___abuse-user-reports', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(moderationInputs.adminAbuseUserReports).output(moderationOutputs.adminAbuseUserReports),
 adminForwardAbuseUserReport: oc.$meta<{ requestName: 'admin/forward-abuse-user-report' }>({ requestName: 'admin/forward-abuse-user-report' })
 .route({ method: 'POST', path: '/admin/forward-abuse-user-report', operationId: 'post___admin___forward-abuse-user-report', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ABUSE_REPORT: { status: 404, data: apiErrorData } }).input(moderationInputs.adminForwardAbuseUserReport).output(moderationOutputs.adminForwardAbuseUserReport),
 adminGetUserIps: oc.$meta<{ requestName: 'admin/get-user-ips' }>({ requestName: 'admin/get-user-ips' })
 .route({ method: 'POST', path: '/admin/get-user-ips', operationId: 'post___admin___get-user-ips', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(moderationInputs.adminGetUserIps).output(moderationOutputs.adminGetUserIps),
 adminResolveAbuseUserReport: oc.$meta<{ requestName: 'admin/resolve-abuse-user-report' }>({ requestName: 'admin/resolve-abuse-user-report' })
 .route({ method: 'POST', path: '/admin/resolve-abuse-user-report', operationId: 'post___admin___resolve-abuse-user-report', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ABUSE_REPORT: { status: 404, data: apiErrorData } }).input(moderationInputs.adminResolveAbuseUserReport).output(moderationOutputs.adminResolveAbuseUserReport),
 adminShowModerationLogs: oc.$meta<{ requestName: 'admin/show-moderation-logs' }>({ requestName: 'admin/show-moderation-logs' })
 .route({ method: 'POST', path: '/admin/show-moderation-logs', operationId: 'post___admin___show-moderation-logs', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(moderationInputs.adminShowModerationLogs).output(moderationOutputs.adminShowModerationLogs),
 adminShowUser: oc.$meta<{ requestName: 'admin/show-user' }>({ requestName: 'admin/show-user' })
 .route({ method: 'POST', path: '/admin/show-user', operationId: 'post___admin___show-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(moderationInputs.adminShowUser).output(moderationOutputs.adminShowUser),
 adminShowUsers: oc.$meta<{ requestName: 'admin/show-users' }>({ requestName: 'admin/show-users' })
 .route({ method: 'POST', path: '/admin/show-users', operationId: 'post___admin___show-users', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(moderationInputs.adminShowUsers).output(moderationOutputs.adminShowUsers),
 adminSuspendUser: oc.$meta<{ requestName: 'admin/suspend-user' }>({ requestName: 'admin/suspend-user' })
 .route({ method: 'POST', path: '/admin/suspend-user', operationId: 'post___admin___suspend-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(moderationInputs.adminSuspendUser).output(moderationOutputs.adminSuspendUser),
 adminUnsetUserAvatar: oc.$meta<{ requestName: 'admin/unset-user-avatar' }>({ requestName: 'admin/unset-user-avatar' })
 .route({ method: 'POST', path: '/admin/unset-user-avatar', operationId: 'post___admin___unset-user-avatar', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(moderationInputs.adminUnsetUserAvatar).output(moderationOutputs.adminUnsetUserAvatar),
 adminUnsetUserBanner: oc.$meta<{ requestName: 'admin/unset-user-banner' }>({ requestName: 'admin/unset-user-banner' })
 .route({ method: 'POST', path: '/admin/unset-user-banner', operationId: 'post___admin___unset-user-banner', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(moderationInputs.adminUnsetUserBanner).output(moderationOutputs.adminUnsetUserBanner),
 adminUnsuspendUser: oc.$meta<{ requestName: 'admin/unsuspend-user' }>({ requestName: 'admin/unsuspend-user' })
 .route({ method: 'POST', path: '/admin/unsuspend-user', operationId: 'post___admin___unsuspend-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(moderationInputs.adminUnsuspendUser).output(moderationOutputs.adminUnsuspendUser),
 adminUpdateAbuseUserReport: oc.$meta<{ requestName: 'admin/update-abuse-user-report' }>({ requestName: 'admin/update-abuse-user-report' })
 .route({ method: 'POST', path: '/admin/update-abuse-user-report', operationId: 'post___admin___update-abuse-user-report', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ABUSE_REPORT: { status: 404, data: apiErrorData } }).input(moderationInputs.adminUpdateAbuseUserReport).output(moderationOutputs.adminUpdateAbuseUserReport),
 adminUpdateUserNote: oc.$meta<{ requestName: 'admin/update-user-note' }>({ requestName: 'admin/update-user-note' })
 .route({ method: 'POST', path: '/admin/update-user-note', operationId: 'post___admin___update-user-note', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(moderationInputs.adminUpdateUserNote).output(moderationOutputs.adminUpdateUserNote),
 usersReportAbuse: oc.$meta<{ requestName: 'users/report-abuse' }>({ requestName: 'users/report-abuse' })
 .route({ method: 'POST', path: '/users/report-abuse', operationId: 'post___users___report-abuse', tags: ['users'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, CANNOT_REPORT_YOURSELF: { status: 400, data: apiErrorData }, CANNOT_REPORT_THE_ADMIN: { status: 400, data: apiErrorData } }).input(moderationInputs.usersReportAbuse).output(moderationOutputs.usersReportAbuse),
};
