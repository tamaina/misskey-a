/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GetterService } from '../../api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { moderationContract } from '@features/moderation/backend/api.contract.js';
import { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import { AbuseUserReportEntityService } from '@features/moderation/backend/serializers/AbuseUserReportEntityService.js';
import { AbuseReportNotificationRecipientEntityService } from '@features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { ModerationLogEntityService } from '@features/moderation/backend/serializers/ModerationLogEntityService.js';
import { AbuseReportService } from '@features/moderation/backend/services/AbuseReportService.js';
import { AbuseReportNotificationService } from '@features/moderation/backend/services/AbuseReportNotificationService.js';
import { UserSuspendService } from '@features/moderation/backend/services/UserSuspendService.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import type { UserProfilesRepository, SigninsRepository, AbuseUserReportsRepository, UserIpsRepository, ModerationLogsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { createModerationRouter } from './api.router.js';

function requiredSchema<T>(schema: T | undefined): T {
	if (schema === undefined) throw new Error("Missing native schema");
	return schema;
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
			abuseReportNotificationRecipientEntityService: { pack: async (row) => v.parse(requiredSchema(moderationContract.adminAbuseReportNotificationRecipientShow['~orpc'].outputSchema), await recipientEntityService.pack(row)), packMany: async (rows) => v.parse(requiredSchema(moderationContract.adminAbuseReportNotificationRecipientList['~orpc'].outputSchema), await recipientEntityService.packMany(rows)) },
			abuseUserReportEntityService: { packMany: async (rows) => v.parse(requiredSchema(moderationContract.adminAbuseUserReports['~orpc'].outputSchema), await reportEntityService.packMany(rows)) },
			moderationLogEntityService: { packMany: async (rows) => v.parse(requiredSchema(moderationContract.adminShowModerationLogs['~orpc'].outputSchema), await logEntityService.packMany(rows)) },
			abuseReportNotificationService: moduleRef.get(AbuseReportNotificationService, { strict: false }),
			abuseReportService: moduleRef.get(AbuseReportService, { strict: false }),
			getterService: getter, userSuspendService: moduleRef.get(UserSuspendService, { strict: false }), moderationLogService,
		});
		return this.router;
	}
}
