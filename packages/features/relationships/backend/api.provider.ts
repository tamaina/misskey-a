/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { createRelationshipsRouter } from './endpoints/relationships.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { UserBlockingService } from './services/UserBlockingService.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { BlockingsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { BlockingEntityService } from './serializers/BlockingEntityService.js';
import { UserFollowingService } from './services/UserFollowingService.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import { FollowingEntityService } from './serializers/FollowingEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserMutingService } from './services/UserMutingService.js';
import { UserRenoteMutingService } from './services/UserRenoteMutingService.js';
import { UserListService } from './services/UserListService.js';
import type { MutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RenoteMutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListMembershipsRepository } from '@features/persistence/backend/repositories/models.js';
import { FollowRequestEntityService } from './serializers/FollowRequestEntityService.js';
import type { FollowRequestsRepository } from '@features/persistence/backend/repositories/models.js';
import { MutingEntityService } from './serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from './serializers/RenoteMutingEntityService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserListEntityService } from './serializers/UserListEntityService.js';
type RelationshipsRouter = ReturnType<typeof createRelationshipsRouter<MiLocalUser>>;
@Injectable()
export class RelationshipsApiProvider {
	private router: RelationshipsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): RelationshipsRouter {
		if (this.router !== undefined) return this.router;
		this.router = createRelationshipsRouter<MiLocalUser>({
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
			blockingsRepository: this.moduleRef.get<BlockingsRepository>(DI.blockingsRepository, { strict: false }),
			userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			getterService: this.moduleRef.get(GetterService, { strict: false }),
			userBlockingService: this.moduleRef.get(UserBlockingService, { strict: false }),
			blockingEntityService: this.moduleRef.get(BlockingEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			followingsRepository: this.moduleRef.get<FollowingsRepository>(DI.followingsRepository, { strict: false }),
			userFollowingService: this.moduleRef.get(UserFollowingService, { strict: false }),
			followingEntityService: this.moduleRef.get(FollowingEntityService, { strict: false }),
			userMutingService: this.moduleRef.get(UserMutingService, { strict: false }),
			userRenoteMutingService: this.moduleRef.get(UserRenoteMutingService, { strict: false }),
			userListService: this.moduleRef.get(UserListService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			mutingsRepository: this.moduleRef.get<MutingsRepository>(DI.mutingsRepository, { strict: false }),
			renoteMutingsRepository: this.moduleRef.get<RenoteMutingsRepository>(DI.renoteMutingsRepository, { strict: false }),
			userListsRepository: this.moduleRef.get<UserListsRepository>(DI.userListsRepository, { strict: false }),
			userListFavoritesRepository: this.moduleRef.get<UserListFavoritesRepository>(DI.userListFavoritesRepository, { strict: false }),
			userListMembershipsRepository: this.moduleRef.get<UserListMembershipsRepository>(DI.userListMembershipsRepository, { strict: false }),
			followRequestsRepository: this.moduleRef.get<FollowRequestsRepository>(DI.followRequestsRepository, { strict: false }),
			followRequestEntityService: this.moduleRef.get(FollowRequestEntityService, { strict: false }),
			mutingEntityService: this.moduleRef.get(MutingEntityService, { strict: false }),
			renoteMutingEntityService: this.moduleRef.get(RenoteMutingEntityService, { strict: false }),
			userProfilesRepository: this.moduleRef.get<UserProfilesRepository>(DI.userProfilesRepository, { strict: false }),
			utilityService: this.moduleRef.get(UtilityService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			userListEntityService: this.moduleRef.get(UserListEntityService, { strict: false }),
		});
		return this.router;
	}
}
