/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { GetterService } from '@features/api/backend/transport/GetterService.js';
import type { UserBlockingService } from './services/UserBlockingService.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { BlockingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { BlockingEntityService } from './serializers/BlockingEntityService.js';
import type { UserFollowingService } from './services/UserFollowingService.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { FollowingEntityService } from './serializers/FollowingEntityService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserMutingService } from './services/UserMutingService.js';
import type { UserRenoteMutingService } from './services/UserRenoteMutingService.js';
import type { UserListService } from './services/UserListService.js';
import type { MutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RenoteMutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListMembershipsRepository } from '@features/persistence/backend/repositories/models.js';
import type { FollowRequestEntityService } from './serializers/FollowRequestEntityService.js';
import type { FollowRequestsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MutingEntityService } from './serializers/MutingEntityService.js';
import type { RenoteMutingEntityService } from './serializers/RenoteMutingEntityService.js';
import type { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListEntityService } from './serializers/UserListEntityService.js';
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
