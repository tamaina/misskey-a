/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BlockingEntityService } from './serializers/BlockingEntityService.js';
import { FollowRequestEntityService } from './serializers/FollowRequestEntityService.js';
import { FollowingEntityService } from './serializers/FollowingEntityService.js';
import { MutingEntityService } from './serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from './serializers/RenoteMutingEntityService.js';
import { UserListEntityService } from './serializers/UserListEntityService.js';
import type { BlockingsRepository, FollowRequestsRepository, FollowingsRepository, MutingsRepository, RenoteMutingsRepository, UserListMembershipsRepository, UserListsRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface RelationshipServicesDependencies {
	blockingsRepository: BlockingsRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'parse'>;
	followRequestsRepository: FollowRequestsRepository;
	followingsRepository: FollowingsRepository;
	mutingsRepository: MutingsRepository;
	renoteMutingsRepository: RenoteMutingsRepository;
	userListsRepository: UserListsRepository;
	userListMembershipsRepository: UserListMembershipsRepository;
}

/** Compose this feature without starting resources or resolving a container. */
export function createRelationshipServices(deps: RelationshipServicesDependencies) {
	const blockingEntityService = new BlockingEntityService(deps.blockingsRepository, deps.userEntityService, deps.idService);
	const followRequestEntityService = new FollowRequestEntityService(deps.followRequestsRepository, deps.userEntityService);
	const followingEntityService = new FollowingEntityService(deps.followingsRepository, deps.userEntityService, deps.idService);
	const mutingEntityService = new MutingEntityService(deps.mutingsRepository, deps.userEntityService, deps.idService);
	const renoteMutingEntityService = new RenoteMutingEntityService(deps.renoteMutingsRepository, deps.userEntityService, deps.idService);
	const userListEntityService = new UserListEntityService(deps.userListsRepository, deps.userListMembershipsRepository, deps.userEntityService, deps.idService);

	return {
		BlockingEntityService: blockingEntityService,
		FollowRequestEntityService: followRequestEntityService,
		FollowingEntityService: followingEntityService,
		MutingEntityService: mutingEntityService,
		RenoteMutingEntityService: renoteMutingEntityService,
		UserListEntityService: userListEntityService,
	};
}

export type RelationshipServices = ReturnType<typeof createRelationshipServices>;
