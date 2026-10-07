/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { BlockingEntityService } from './serializers/BlockingEntityService.js';
import { FollowRequestEntityService } from './serializers/FollowRequestEntityService.js';
import { FollowingEntityService } from './serializers/FollowingEntityService.js';
import { MutingEntityService } from './serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from './serializers/RenoteMutingEntityService.js';
import { UserListEntityService } from './serializers/UserListEntityService.js';

export const relationshipServices = defineServices({
	BlockingEntityService: service(BlockingEntityService, [ports.blockingsRepository, ports.userEntityService, ports.idService]),
	FollowRequestEntityService: service(FollowRequestEntityService, [ports.followRequestsRepository, ports.userEntityService]),
	FollowingEntityService: service(FollowingEntityService, [ports.followingsRepository, ports.userEntityService, ports.idService]),
	MutingEntityService: service(MutingEntityService, [ports.mutingsRepository, ports.userEntityService, ports.idService]),
	RenoteMutingEntityService: service(RenoteMutingEntityService, [ports.renoteMutingsRepository, ports.userEntityService, ports.idService]),
	UserListEntityService: service(UserListEntityService, [ports.userListsRepository, ports.userListMembershipsRepository, ports.userEntityService, ports.idService]),
});
