/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { BlockingEntityService } from './serializers/BlockingEntityService.js';
import { FollowRequestEntityService } from './serializers/FollowRequestEntityService.js';
import { FollowingEntityService } from './serializers/FollowingEntityService.js';
import { MutingEntityService } from './serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from './serializers/RenoteMutingEntityService.js';
import { UserListEntityService } from './serializers/UserListEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const relationshipServices = defineServices({
	BlockingEntityService: service(BlockingEntityService, [ports.blockingsRepository, ports.userEntityService, ports.idService]),
	FollowRequestEntityService: service(FollowRequestEntityService, [ports.followRequestsRepository, ports.userEntityService]),
	FollowingEntityService: service(FollowingEntityService, [ports.followingsRepository, ports.userEntityService, ports.idService]),
	MutingEntityService: service(MutingEntityService, [ports.mutingsRepository, ports.userEntityService, ports.idService]),
	RenoteMutingEntityService: service(RenoteMutingEntityService, [ports.renoteMutingsRepository, ports.userEntityService, ports.idService]),
	UserListEntityService: service(UserListEntityService, [ports.userListsRepository, ports.userListMembershipsRepository, ports.userEntityService, ports.idService]),
});
export const createRelationshipServices = relationshipServices.create;
export type RelationshipServicesDependencies = Inputs<typeof relationshipServices>;
export type RelationshipServices = Outputs<typeof relationshipServices>;
