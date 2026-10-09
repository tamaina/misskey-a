/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { usersContract } from './api.definition.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from './models/User.js';
import { createAdminAccountsDeleteProcedure } from './endpoints/admin/accounts/delete.js';
import type { AdminAccountsDeleteDependencies } from './endpoints/admin/accounts/delete.js';
import { createAdminAccountsFindByEmailProcedure } from './endpoints/admin/accounts/find-by-email.js';
import type { AdminAccountsFindByEmailDependencies } from './endpoints/admin/accounts/find-by-email.js';
import { createAdminDeleteAccountProcedure } from './endpoints/admin/delete-account.js';
import type { AdminDeleteAccountDependencies } from './endpoints/admin/delete-account.js';
import { createAdminUpdateProxyAccountProcedure } from './endpoints/admin/update-proxy-account.js';
import type { AdminUpdateProxyAccountDependencies } from './endpoints/admin/update-proxy-account.js';
import { createIProcedure } from './endpoints/i.js';
import type { IDependencies } from './endpoints/i.js';
import { createIClaimAchievementProcedure } from './endpoints/i/claim-achievement.js';
import type { IClaimAchievementDependencies } from './endpoints/i/claim-achievement.js';
import { createIDeleteAccountProcedure } from './endpoints/i/delete-account.js';
import type { IDeleteAccountDependencies } from './endpoints/i/delete-account.js';
import { createIMoveProcedure } from './endpoints/i/move.js';
import type { IMoveDependencies } from './endpoints/i/move.js';
import { createIUpdateProcedure } from './endpoints/i/update.js';
import type { IUpdateDependencies, UserProfileUpdateRepository } from './endpoints/i/update.js';
import { createUsersProcedure } from './endpoints/users.js';
import type { UsersDependencies } from './endpoints/users.js';
import { createUsersAchievementsProcedure } from './endpoints/users/achievements.js';
import type { UsersAchievementsDependencies } from './endpoints/users/achievements.js';
import { createUsersShowProcedure } from './endpoints/users/show.js';
import type { UsersShowDependencies } from './endpoints/users/show.js';
import { createUsersUpdateMemoProcedure } from './endpoints/users/update-memo.js';
import type { UsersUpdateMemoDependencies } from './endpoints/users/update-memo.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, UserProfilesRepository, MiMeta, DriveFilesRepository, PagesRepository, UserMemoRepository } from '@features/persistence/backend/repositories/models.js';
import { DeleteAccountService } from './services/DeleteAccountService.js';
import { UserEntityService } from './serializers/UserEntityService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { SystemAccountService } from './services/SystemAccountService.js';
import { AchievementService } from './services/AchievementService.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { AccountMoveService } from './services/AccountMoveService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import type { Config } from '@/config.js';
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
import { IdService } from '@features/runtime/backend/services/IdService.js';

export interface UsersRouterDependencies {
	'admin/accounts/delete': AdminAccountsDeleteDependencies;
	'admin/accounts/find-by-email': AdminAccountsFindByEmailDependencies;
	'admin/delete-account': AdminDeleteAccountDependencies;
	'admin/update-proxy-account': AdminUpdateProxyAccountDependencies;
	'i': IDependencies;
	'i/claim-achievement': IClaimAchievementDependencies;
	'i/delete-account': IDeleteAccountDependencies;
	'i/move': IMoveDependencies;
	'i/update': IUpdateDependencies;
	'users': UsersDependencies;
	'users/achievements': UsersAchievementsDependencies;
	'users/show': UsersShowDependencies;
	'users/update-memo': UsersUpdateMemoDependencies;
}

export function createUsersRouter(deps: UsersRouterDependencies) {
	return implement(usersContract).$context<ApiContext<MiLocalUser>>().router({
		'admin/accounts/delete': createAdminAccountsDeleteProcedure(deps['admin/accounts/delete']),
		'admin/accounts/find-by-email': createAdminAccountsFindByEmailProcedure(deps['admin/accounts/find-by-email']),
		'admin/delete-account': createAdminDeleteAccountProcedure(deps['admin/delete-account']),
		'admin/update-proxy-account': createAdminUpdateProxyAccountProcedure(deps['admin/update-proxy-account']),
		'i': createIProcedure(deps['i']),
		'i/claim-achievement': createIClaimAchievementProcedure(deps['i/claim-achievement']),
		'i/delete-account': createIDeleteAccountProcedure(deps['i/delete-account']),
		'i/move': createIMoveProcedure(deps['i/move']),
		'i/update': createIUpdateProcedure(deps['i/update']),
		'users': createUsersProcedure(deps['users']),
		'users/achievements': createUsersAchievementsProcedure(deps['users/achievements']),
		'users/show': createUsersShowProcedure(deps['users/show']),
		'users/update-memo': createUsersUpdateMemoProcedure(deps['users/update-memo']),
	});
}

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
