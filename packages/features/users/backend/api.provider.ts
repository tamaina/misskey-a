/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createUsersRouter } from './api.router.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { DeleteAccountService } from './services/DeleteAccountService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from './serializers/UserEntityService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { SystemAccountService } from './services/SystemAccountService.js';
import { AchievementService } from './services/AchievementService.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { AccountMoveService } from './services/AccountMoveService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import type { Config } from '@/config.js';
import type { UserProfileUpdateRepository } from './endpoints/i/update.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { AccountUpdateService } from './services/AccountUpdateService.js';
import { HashtagService } from '@features/discovery/backend/services/HashtagService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { CacheService } from './services/CacheService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { PerUserPvChart } from '@features/statistics/backend/charts/per-user-pv.js';
import type { UserMemoRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
type UsersRouter = ReturnType<typeof createUsersRouter>;
/** Compose once after all domain providers and initialization hooks are ready. */
@Injectable()
export class UsersApiProvider {
	private router: UsersRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): UsersRouter {
		if (this.router !== undefined) return this.router;
		this.router = createUsersRouter({
			'admin/accounts/delete': {
				usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
				deleteAccoountService: this.moduleRef.get(DeleteAccountService, { strict: false }),
			},
			'admin/accounts/find-by-email': {
				userProfilesRepository: this.moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			},
			'admin/delete-account': {
				usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
				deleteAccountService: this.moduleRef.get(DeleteAccountService, { strict: false }),
			},
			'admin/update-proxy-account': {
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
				moderationLogService: this.moduleRef.get(ModerationLogService, { strict: false }),
				systemAccountService: this.moduleRef.get(SystemAccountService, { strict: false }),
			},
			'i': {
				userProfilesRepository: this.moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			},
			'i/claim-achievement': {
				achievementService: this.moduleRef.get(AchievementService, { strict: false }),
			},
			'i/delete-account': {
				usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
				userProfilesRepository: this.moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
				userAuthService: this.moduleRef.get(UserAuthService, { strict: false }),
				deleteAccountService: this.moduleRef.get(DeleteAccountService, { strict: false }),
			},
			'i/move': {
				serverSettings: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
				remoteUserResolveService: this.moduleRef.get(RemoteUserResolveService, { strict: false }),
				apiLoggerService: this.moduleRef.get(ApiLoggerService, { strict: false }),
				accountMoveService: this.moduleRef.get(AccountMoveService, { strict: false }),
				getterService: this.moduleRef.get(GetterService, { strict: false }),
				apPersonService: this.moduleRef.get(ApPersonService, { strict: false }),
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			},
			'i/update': {
				config: this.moduleRef.get<Config>(DI.config, { strict: false }),
				instanceMeta: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
				usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
				userProfilesRepository: this.moduleRef.get<UserProfileUpdateRepository>(DI.userProfilesRepository, { strict: false }),
				driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
				pagesRepository: this.moduleRef.get<PagesRepository>(DI.pagesRepository, { strict: false }),
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
				driveFileEntityService: this.moduleRef.get(DriveFileEntityService, { strict: false }),
				globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
				userFollowingService: this.moduleRef.get(UserFollowingService, { strict: false }),
				accountUpdateService: this.moduleRef.get(AccountUpdateService, { strict: false }),
				remoteUserResolveService: this.moduleRef.get(RemoteUserResolveService, { strict: false }),
				apiLoggerService: this.moduleRef.get(ApiLoggerService, { strict: false }),
				hashtagService: this.moduleRef.get(HashtagService, { strict: false }),
				roleService: this.moduleRef.get(RoleService, { strict: false }),
				cacheService: this.moduleRef.get(CacheService, { strict: false }),
				httpRequestService: this.moduleRef.get(HttpRequestService, { strict: false }),
				avatarDecorationService: this.moduleRef.get(AvatarDecorationService, { strict: false }),
				utilityService: this.moduleRef.get(UtilityService, { strict: false }),
			},
			'users': {
				usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
				queryService: this.moduleRef.get(QueryService, { strict: false }),
			},
			'users/achievements': {
				userProfilesRepository: this.moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
			},
			'users/show': {
				serverSettings: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
				usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
				userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
				remoteUserResolveService: this.moduleRef.get(RemoteUserResolveService, { strict: false }),
				roleService: this.moduleRef.get(RoleService, { strict: false }),
				perUserPvChart: this.moduleRef.get(PerUserPvChart, { strict: false }),
				apiLoggerService: this.moduleRef.get(ApiLoggerService, { strict: false }),
			},
			'users/update-memo': {
				userMemosRepository: this.moduleRef.get<UserMemoRepository>(DI.userMemosRepository, { strict: false }),
				getterService: this.moduleRef.get(GetterService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
		});
		return this.router;
	}
}
