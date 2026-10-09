/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toRecipientWire, toReportWire, toModerationLogWire } from './public-wire.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiRole } from '@features/roles/backend/models/Role.js';
import { moderationContract } from './api.definition.js';
import type { UsersRepository, UserProfilesRepository, SigninsRepository, AbuseUserReportsRepository, UserIpsRepository, ModerationLogsRepository, MiAbuseUserReport, MiAbuseReportNotificationRecipient, MiModerationLog } from '@features/persistence/backend/repositories/models.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { AbuseReportService } from '@features/moderation/backend/services/AbuseReportService.js';
import { AbuseReportNotificationService } from '@features/moderation/backend/services/AbuseReportNotificationService.js';
import { implement } from '@orpc/server';
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
import { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import { AbuseUserReportEntityService } from '@features/moderation/backend/serializers/AbuseUserReportEntityService.js';
import { AbuseReportNotificationRecipientEntityService } from '@features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { ModerationLogEntityService } from '@features/moderation/backend/serializers/ModerationLogEntityService.js';
import { UserSuspendService } from '@features/moderation/backend/services/UserSuspendService.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DI } from '@/di-symbols.js';

type Outputs = InferContractRouterOutputs<typeof moderationContract>;

export interface ModerationApiDependencies<Actor extends ApiActor> {
	usersRepository: Pick<UsersRepository, 'findOneBy' | 'findOneByOrFail' | 'createQueryBuilder' | 'update'>;
	userProfilesRepository: Pick<UserProfilesRepository, 'findOneBy' | 'findOneByOrFail' | 'update'>;
	signinsRepository: Pick<SigninsRepository, 'findBy'>;
	abuseUserReportsRepository: Pick<AbuseUserReportsRepository, 'findOneBy' | 'createQueryBuilder'>;
	userIpsRepository: Pick<UserIpsRepository, 'find'>;
	moderationLogsRepository: Pick<ModerationLogsRepository, 'createQueryBuilder'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	idService: Pick<IdService, 'parse'>;
	roleService: Pick<RoleService, 'isModerator' | 'isAdministrator' | 'getUserPolicies' | 'getUserAssigns' | 'getUserRoles' | 'getAdministratorIds' | 'getModeratorIds'>;
	roleEntityService: {
		packMany(roles: MiRole[], actor: Actor): Promise<Outputs['adminShowUser']['roles']>;
	};
	userEntityService: {
		packMany(users: MiUser[], actor: Actor, options: {
			schema: 'UserDetailed';
		}): Promise<Outputs['adminShowUsers']>;
	};
	abuseReportNotificationRecipientEntityService: {
		pack(row: MiAbuseReportNotificationRecipient): Promise<Outputs['adminAbuseReportNotificationRecipientShow']>;
		packMany(rows: MiAbuseReportNotificationRecipient[]): Promise<Outputs['adminAbuseReportNotificationRecipientList']>;
	};
	abuseUserReportEntityService: {
		packMany(rows: MiAbuseUserReport[]): Promise<Outputs['adminAbuseUserReports']>;
	};
	moderationLogEntityService: {
		packMany(rows: MiModerationLog[]): Promise<Outputs['adminShowModerationLogs']>;
	};
	abuseReportNotificationService: {
		fetchRecipients: AbuseReportNotificationService['fetchRecipients'];
		createRecipient(params: Parameters<AbuseReportNotificationService['createRecipient']>[0], actor: Actor): Promise<MiAbuseReportNotificationRecipient>;
		updateRecipient(params: Parameters<AbuseReportNotificationService['updateRecipient']>[0], actor: Actor): Promise<MiAbuseReportNotificationRecipient>;
		deleteRecipient(id: string, actor: Actor): Promise<void>;
	};
	abuseReportService: {
		report: AbuseReportService['report'];
		forward(id: string, actor: Actor): Promise<void>;
		resolve(params: Parameters<AbuseReportService['resolve']>[0], actor: Actor): ReturnType<AbuseReportService['resolve']>;
		update(id: string, params: Parameters<AbuseReportService['update']>[1], actor: Actor): Promise<void>;
	};
	getterService: Pick<GetterService, 'getUser'>;
	userSuspendService: {
		suspend(user: MiUser, actor: Actor): Promise<void>;
		unsuspend(user: MiUser, actor: Actor): Promise<void>;
	};
	moderationLogService: Pick<ModerationLogService, 'log'>;
}

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

type ModerationRouter = ReturnType<typeof createModerationRouter<MiLocalUser>>;

@Injectable()
export class ModerationApiProvider {
	private router: ModerationRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): ModerationRouter {
		if (this.router !== undefined) return this.router;
		const moduleRef = this.moduleRef;
		const users = moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false });
		const roles = moduleRef.get(RoleService, { strict: false });
		const getter = moduleRef.get(GetterService, { strict: false });
		const queryService = moduleRef.get(QueryService, { strict: false });
		const idService = moduleRef.get(IdService, { strict: false });
		const moderationLogService = moduleRef.get(ModerationLogService, { strict: false });
		const roleEntityService = moduleRef.get(RoleEntityService, { strict: false });
		const reportEntityService = moduleRef.get(AbuseUserReportEntityService, { strict: false });
		const recipientEntityService = moduleRef.get(AbuseReportNotificationRecipientEntityService, { strict: false });
		const logEntityService = moduleRef.get(ModerationLogEntityService, { strict: false });
		const userEntityService = moduleRef.get(UserEntityService, { strict: false });
		this.router = createModerationRouter<MiLocalUser>({
			usersRepository: users,
			userProfilesRepository: moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
			signinsRepository: moduleRef.get<SigninsRepository>(DI.signinsRepository, { strict: false }),
			abuseUserReportsRepository: moduleRef.get<AbuseUserReportsRepository>(DI.abuseUserReportsRepository, { strict: false }),
			userIpsRepository: moduleRef.get<UserIpsRepository>(DI.userIpsRepository, { strict: false }),
			moderationLogsRepository: moduleRef.get<ModerationLogsRepository>(DI.moderationLogsRepository, { strict: false }),
			queryService, idService, roleService: roles, roleEntityService,
			userEntityService: { packMany: async (rows, actor, options) => (await userEntityService.packMany(rows, actor, options)).map(toPackedUserDetailed) },
			abuseReportNotificationRecipientEntityService: { pack: async (row) => toRecipientWire(await recipientEntityService.pack(row)), packMany: async (rows) => (await recipientEntityService.packMany(rows)).map(toRecipientWire) },
			abuseUserReportEntityService: { packMany: async (rows) => (await reportEntityService.packMany(rows)).map(toReportWire) },
			moderationLogEntityService: { packMany: async (rows) => (await logEntityService.packMany(rows)).map(toModerationLogWire) },
			abuseReportNotificationService: moduleRef.get(AbuseReportNotificationService, { strict: false }),
			abuseReportService: moduleRef.get(AbuseReportService, { strict: false }),
			getterService: getter, userSuspendService: moduleRef.get(UserSuspendService, { strict: false }), moderationLogService,
		});
		return this.router;
	}
}
