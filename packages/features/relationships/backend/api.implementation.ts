/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { UserBlockingService } from './services/UserBlockingService.js';
import type { UsersRepository, BlockingsRepository, FollowingsRepository, MutingsRepository, RenoteMutingsRepository, UserListsRepository, UserListFavoritesRepository, UserListMembershipsRepository, FollowRequestsRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { BlockingEntityService } from './serializers/BlockingEntityService.js';
import { UserFollowingService } from './services/UserFollowingService.js';
import { FollowingEntityService } from './serializers/FollowingEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserMutingService } from './services/UserMutingService.js';
import { UserRenoteMutingService } from './services/UserRenoteMutingService.js';
import { UserListService } from './services/UserListService.js';
import { FollowRequestEntityService } from './serializers/FollowRequestEntityService.js';
import { MutingEntityService } from './serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from './serializers/RenoteMutingEntityService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { UserListEntityService } from './serializers/UserListEntityService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createRelationshipsRouter } from './endpoints/relationships.js';

export interface RelationshipsDependencies {
	usersRepository: Pick<UsersRepository, 'findOneByOrFail' | 'findOneBy'>;
	blockingsRepository: Pick<BlockingsRepository, 'exists' | 'createQueryBuilder'>;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany' | 'getRelations' | 'getRelation'>;
	getterService: Pick<GetterService, 'getUser'>;
	userBlockingService: Pick<UserBlockingService, 'block' | 'unblock'>;
	blockingEntityService: Pick<BlockingEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	followingsRepository: Pick<FollowingsRepository, 'exists' | 'findOneBy' | 'createQueryBuilder' | 'update'>;
	userFollowingService: Pick<UserFollowingService, 'follow' | 'unfollow' | 'acceptFollowRequest' | 'cancelFollowRequest' | 'rejectFollowRequest'>;
	followingEntityService: Pick<FollowingEntityService, 'packMany'>;
	userMutingService: Pick<UserMutingService, 'mute' | 'unmute'>;
	userRenoteMutingService: Pick<UserRenoteMutingService, 'mute' | 'unmute'>;
	userListService: Pick<UserListService, 'addMember' | 'removeMember' | 'updateMembership'>;
	idService: Pick<IdService, 'gen'>;
	mutingsRepository: Pick<MutingsRepository, 'exists' | 'findOneBy' | 'createQueryBuilder'>;
	renoteMutingsRepository: Pick<RenoteMutingsRepository, 'exists' | 'findOneBy' | 'createQueryBuilder'>;
	userListsRepository: UserListsRepository;
	userListFavoritesRepository: Pick<UserListFavoritesRepository, 'exists' | 'insert' | 'countBy' | 'findOneBy' | 'delete'>;
	userListMembershipsRepository: Pick<UserListMembershipsRepository, 'findBy' | 'exists' | 'createQueryBuilder'>;
	followRequestsRepository: Pick<FollowRequestsRepository, 'createQueryBuilder'>;
	followRequestEntityService: Pick<FollowRequestEntityService, 'packMany'>;
	mutingEntityService: Pick<MutingEntityService, 'packMany'>;
	renoteMutingEntityService: Pick<RenoteMutingEntityService, 'packMany'>;
	userProfilesRepository: Pick<UserProfilesRepository, 'findOneByOrFail' | 'metadata'>;
	utilityService: Pick<UtilityService, 'toPunyNullable'>;
	roleService: Pick<RoleService, 'isModerator' | 'getUserPolicies'>;
	userListEntityService: Pick<UserListEntityService, 'pack' | 'packMembershipsMany'>;
}

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
