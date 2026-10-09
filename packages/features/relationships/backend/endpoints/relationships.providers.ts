/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RelationshipsCommandOperations } from './relationships-command.operations.js';
import { BlockingCreateOperation } from './blocking/create.js';
import { BlockingDeleteOperation } from './blocking/delete.js';
import { BlockingListOperation } from './blocking/list.js';
import { FollowingCreateOperation } from './following/create.js';
import { FollowingDeleteOperation } from './following/delete.js';
import { FollowingInvalidateOperation } from './following/invalidate.js';
import { FollowingListOperation } from './following/list.js';
import { FollowingRequestsCancelOperation } from './following/requests/cancel.js';
import { FollowingRequestsListOperation } from './following/requests/list.js';
import { FollowingRequestsSentOperation } from './following/requests/sent.js';
import { FollowingUpdateOperation } from './following/update.js';
import { FollowingUpdateAllOperation } from './following/update-all.js';
import { MuteCreateOperation } from './mute/create.js';
import { MuteListOperation } from './mute/list.js';
import { RenoteMuteListOperation } from './renote-mute/list.js';
import { UsersFollowersOperation } from './users/followers.js';
import { UsersFollowingOperation } from './users/following.js';
import { UsersGetFollowingUsersByBirthdayOperation } from './users/get-following-users-by-birthday.js';
import { UsersListsCreateOperation } from './users/lists/create.js';
import { UsersListsCreateFromPublicOperation } from './users/lists/create-from-public.js';
import { UsersListsGetMembershipsOperation } from './users/lists/get-memberships.js';
import { UsersListsListOperation } from './users/lists/list.js';
import { UsersListsShowOperation } from './users/lists/show.js';
import { UsersListsUpdateOperation } from './users/lists/update.js';
import { UsersRelationOperation } from './users/relation.js';
import { RelationshipsApplicationService } from './relationships.application.js';
export const relationshipsProviders = [
	RelationshipsApplicationService,
	RelationshipsCommandOperations,
	BlockingCreateOperation,
	BlockingDeleteOperation,
	BlockingListOperation,
	FollowingCreateOperation,
	FollowingDeleteOperation,
	FollowingInvalidateOperation,
	FollowingListOperation,
	FollowingRequestsCancelOperation,
	FollowingRequestsListOperation,
	FollowingRequestsSentOperation,
	FollowingUpdateOperation,
	FollowingUpdateAllOperation,
	MuteCreateOperation,
	MuteListOperation,
	RenoteMuteListOperation,
	UsersFollowersOperation,
	UsersFollowingOperation,
	UsersGetFollowingUsersByBirthdayOperation,
	UsersListsCreateOperation,
	UsersListsCreateFromPublicOperation,
	UsersListsGetMembershipsOperation,
	UsersListsListOperation,
	UsersListsShowOperation,
	UsersListsUpdateOperation,
	UsersRelationOperation,
];
