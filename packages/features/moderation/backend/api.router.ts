/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { moderationContract } from './api.contract.js';
import type { ModerationApiDependencies } from './api.dependencies.js';
import { createAdminAbuseReportNotificationRecipientCreateProcedure } from './endpoints/admin/abuse-report/notification-recipient/create.js';
import { createAdminAbuseReportNotificationRecipientDeleteProcedure } from './endpoints/admin/abuse-report/notification-recipient/delete.js';
import { createAdminAbuseReportNotificationRecipientListProcedure } from './endpoints/admin/abuse-report/notification-recipient/list.js';
import { createAdminAbuseReportNotificationRecipientShowProcedure } from './endpoints/admin/abuse-report/notification-recipient/show.js';
import { createAdminAbuseReportNotificationRecipientUpdateProcedure } from './endpoints/admin/abuse-report/notification-recipient/update.js';
import { createAdminAbuseUserReportsProcedure } from './endpoints/admin/abuse-user-reports.js';
import { createAdminForwardAbuseUserReportProcedure } from './endpoints/admin/forward-abuse-user-report.js';
import { createAdminGetUserIpsProcedure } from './endpoints/admin/get-user-ips.js';
import { createAdminResolveAbuseUserReportProcedure } from './endpoints/admin/resolve-abuse-user-report.js';
import { createAdminShowModerationLogsProcedure } from './endpoints/admin/show-moderation-logs.js';
import { createAdminShowUserProcedure } from './endpoints/admin/show-user.js';
import { createAdminShowUsersProcedure } from './endpoints/admin/show-users.js';
import { createAdminSuspendUserProcedure } from './endpoints/admin/suspend-user.js';
import { createAdminUnsetUserAvatarProcedure } from './endpoints/admin/unset-user-avatar.js';
import { createAdminUnsetUserBannerProcedure } from './endpoints/admin/unset-user-banner.js';
import { createAdminUnsuspendUserProcedure } from './endpoints/admin/unsuspend-user.js';
import { createAdminUpdateAbuseUserReportProcedure } from './endpoints/admin/update-abuse-user-report.js';
import { createAdminUpdateUserNoteProcedure } from './endpoints/admin/update-user-note.js';
import { createUsersReportAbuseProcedure } from './endpoints/users/report-abuse.js';
export function createModerationRouter<Actor extends ApiActor>(deps: ModerationApiDependencies<Actor>) {
	return implement(moderationContract).$context<ApiContext<Actor>>().router({
		adminAbuseReportNotificationRecipientCreate: createAdminAbuseReportNotificationRecipientCreateProcedure<Actor>(deps),
		adminAbuseReportNotificationRecipientDelete: createAdminAbuseReportNotificationRecipientDeleteProcedure<Actor>(deps),
		adminAbuseReportNotificationRecipientList: createAdminAbuseReportNotificationRecipientListProcedure<Actor>(deps),
		adminAbuseReportNotificationRecipientShow: createAdminAbuseReportNotificationRecipientShowProcedure<Actor>(deps),
		adminAbuseReportNotificationRecipientUpdate: createAdminAbuseReportNotificationRecipientUpdateProcedure<Actor>(deps),
		adminAbuseUserReports: createAdminAbuseUserReportsProcedure<Actor>(deps),
		adminForwardAbuseUserReport: createAdminForwardAbuseUserReportProcedure<Actor>(deps),
		adminGetUserIps: createAdminGetUserIpsProcedure<Actor>(deps),
		adminResolveAbuseUserReport: createAdminResolveAbuseUserReportProcedure<Actor>(deps),
		adminShowModerationLogs: createAdminShowModerationLogsProcedure<Actor>(deps),
		adminShowUser: createAdminShowUserProcedure<Actor>(deps),
		adminShowUsers: createAdminShowUsersProcedure<Actor>(deps),
		adminSuspendUser: createAdminSuspendUserProcedure<Actor>(deps),
		adminUnsetUserAvatar: createAdminUnsetUserAvatarProcedure<Actor>(deps),
		adminUnsetUserBanner: createAdminUnsetUserBannerProcedure<Actor>(deps),
		adminUnsuspendUser: createAdminUnsuspendUserProcedure<Actor>(deps),
		adminUpdateAbuseUserReport: createAdminUpdateAbuseUserReportProcedure<Actor>(deps),
		adminUpdateUserNote: createAdminUpdateUserNoteProcedure<Actor>(deps),
		usersReportAbuse: createUsersReportAbuseProcedure<Actor>(deps),
	});
}
