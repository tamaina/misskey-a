/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '../../users/backend/models/User.js';
import type { MiRole } from '../../roles/backend/models/Role.js';
import type { moderationContract } from './api.contract.js';
import type { UsersRepository, UserProfilesRepository, SigninsRepository, AbuseUserReportsRepository, UserIpsRepository, ModerationLogsRepository, MiAbuseUserReport, MiAbuseReportNotificationRecipient, MiModerationLog } from '../../persistence/backend/repositories/models.js';
import type { GetterService } from '../../api/backend/transport/GetterService.js';
import type { AbuseReportService } from './services/AbuseReportService.js';
import type { AbuseReportNotificationService } from './services/AbuseReportNotificationService.js';
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
