/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { toPackedUserDetailed } from '../../../users/backend/user.schema.js';
import { toPackedFollowing, toPackedUserRelation } from './relationships.schema.js';
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
import type { RelationshipsOperations } from './relationships.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class RelationshipsApplicationService implements RelationshipsOperations<MiLocalUser> {
	constructor(
		private readonly commands: RelationshipsCommandOperations,
		private readonly blockingCreateOperation: BlockingCreateOperation,
		private readonly blockingDeleteOperation: BlockingDeleteOperation,
		private readonly blockingListOperation: BlockingListOperation,
		private readonly followingCreateOperation: FollowingCreateOperation,
		private readonly followingDeleteOperation: FollowingDeleteOperation,
		private readonly followingInvalidateOperation: FollowingInvalidateOperation,
		private readonly followingListOperation: FollowingListOperation,
		private readonly followingRequestsCancelOperation: FollowingRequestsCancelOperation,
		private readonly followingRequestsListOperation: FollowingRequestsListOperation,
		private readonly followingRequestsSentOperation: FollowingRequestsSentOperation,
		private readonly followingUpdateOperation: FollowingUpdateOperation,
		private readonly followingUpdateAllOperation: FollowingUpdateAllOperation,
		private readonly muteCreateOperation: MuteCreateOperation,
		private readonly muteListOperation: MuteListOperation,
		private readonly renoteMuteListOperation: RenoteMuteListOperation,
		private readonly usersFollowersOperation: UsersFollowersOperation,
		private readonly usersFollowingOperation: UsersFollowingOperation,
		private readonly usersGetFollowingUsersByBirthdayOperation: UsersGetFollowingUsersByBirthdayOperation,
		private readonly usersListsCreateOperation: UsersListsCreateOperation,
		private readonly usersListsCreateFromPublicOperation: UsersListsCreateFromPublicOperation,
		private readonly usersListsGetMembershipsOperation: UsersListsGetMembershipsOperation,
		private readonly usersListsListOperation: UsersListsListOperation,
		private readonly usersListsShowOperation: UsersListsShowOperation,
		private readonly usersListsUpdateOperation: UsersListsUpdateOperation,
		private readonly usersRelationOperation: UsersRelationOperation,
	) {}
	'blocking/create': RelationshipsOperations<MiLocalUser>['blocking/create'] = async (input, actor) => toPackedUserDetailed(await this.blockingCreateOperation.execute(input, actor));
	'blocking/delete': RelationshipsOperations<MiLocalUser>['blocking/delete'] = async (input, actor) => toPackedUserDetailed(await this.blockingDeleteOperation.execute(input, actor));
	'blocking/list': RelationshipsOperations<MiLocalUser>['blocking/list'] = async (input, actor) => (await this.blockingListOperation.execute(input, actor)).map(row => ({ ...row, blockee: toPackedUserDetailed(row.blockee) }));
	'following/create': RelationshipsOperations<MiLocalUser>['following/create'] = (input, actor) => this.followingCreateOperation.execute(input, actor);
	'following/delete': RelationshipsOperations<MiLocalUser>['following/delete'] = (input, actor) => this.followingDeleteOperation.execute(input, actor);
	'following/invalidate': RelationshipsOperations<MiLocalUser>['following/invalidate'] = (input, actor) => this.followingInvalidateOperation.execute(input, actor);
	'following/list': RelationshipsOperations<MiLocalUser>['following/list'] = async (input, actor) => (await this.followingListOperation.execute(input, actor)).map(toPackedFollowing);
	'following/requests/cancel': RelationshipsOperations<MiLocalUser>['following/requests/cancel'] = (input, actor) => this.followingRequestsCancelOperation.execute(input, actor);
	'following/requests/list': RelationshipsOperations<MiLocalUser>['following/requests/list'] = (input, actor) => this.followingRequestsListOperation.execute(input, actor);
	'following/requests/sent': RelationshipsOperations<MiLocalUser>['following/requests/sent'] = (input, actor) => this.followingRequestsSentOperation.execute(input, actor);
	'following/update': RelationshipsOperations<MiLocalUser>['following/update'] = (input, actor) => this.followingUpdateOperation.execute(input, actor);
	'following/update-all': RelationshipsOperations<MiLocalUser>['following/update-all'] = (input, actor) => this.followingUpdateAllOperation.execute(input, actor);
	'mute/create': RelationshipsOperations<MiLocalUser>['mute/create'] = (input, actor) => this.muteCreateOperation.execute(input, actor);
	'mute/list': RelationshipsOperations<MiLocalUser>['mute/list'] = async (input, actor) => (await this.muteListOperation.execute(input, actor)).map(row => ({ ...row, mutee: toPackedUserDetailed(row.mutee) }));
	'renote-mute/list': RelationshipsOperations<MiLocalUser>['renote-mute/list'] = async (input, actor) => (await this.renoteMuteListOperation.execute(input, actor)).map(row => ({ ...row, mutee: toPackedUserDetailed(row.mutee) }));
	'users/followers': RelationshipsOperations<MiLocalUser>['users/followers'] = async (input, actor) => (await this.usersFollowersOperation.execute(input, actor)).map(toPackedFollowing);
	'users/following': RelationshipsOperations<MiLocalUser>['users/following'] = async (input, actor) => (await this.usersFollowingOperation.execute(input, actor)).map(toPackedFollowing);
	'users/get-following-users-by-birthday': RelationshipsOperations<MiLocalUser>['users/get-following-users-by-birthday'] = (input, actor) => this.usersGetFollowingUsersByBirthdayOperation.execute(input, actor);
	'users/lists/create': RelationshipsOperations<MiLocalUser>['users/lists/create'] = (input, actor) => this.usersListsCreateOperation.execute(input, actor);
	'users/lists/create-from-public': RelationshipsOperations<MiLocalUser>['users/lists/create-from-public'] = (input, actor) => this.usersListsCreateFromPublicOperation.execute(input, actor);
	'users/lists/get-memberships': RelationshipsOperations<MiLocalUser>['users/lists/get-memberships'] = (input, actor) => this.usersListsGetMembershipsOperation.execute(input, actor);
	'users/lists/list': RelationshipsOperations<MiLocalUser>['users/lists/list'] = (input, actor) => this.usersListsListOperation.execute(input, actor);
	'users/lists/show': RelationshipsOperations<MiLocalUser>['users/lists/show'] = (input, actor) => this.usersListsShowOperation.execute(input, actor);
	'users/lists/update': RelationshipsOperations<MiLocalUser>['users/lists/update'] = (input, actor) => this.usersListsUpdateOperation.execute(input, actor);
	'users/relation': RelationshipsOperations<MiLocalUser>['users/relation'] = async (input, actor) => (await this.usersRelationOperation.execute(input, actor)).map(toPackedUserRelation);
	'following/requests/accept': RelationshipsOperations<MiLocalUser>['following/requests/accept'] = (input, actor) => this.commands.accept(input, actor);
	'following/requests/reject': RelationshipsOperations<MiLocalUser>['following/requests/reject'] = (input, actor) => this.commands.reject(input, actor);
	'mute/delete': RelationshipsOperations<MiLocalUser>['mute/delete'] = (input, actor) => this.commands.deleteMute(input, actor);
	'renote-mute/create': RelationshipsOperations<MiLocalUser>['renote-mute/create'] = (input, actor) => this.commands.createRenoteMute(input, actor);
	'renote-mute/delete': RelationshipsOperations<MiLocalUser>['renote-mute/delete'] = (input, actor) => this.commands.deleteRenoteMute(input, actor);
	'users/lists/delete': RelationshipsOperations<MiLocalUser>['users/lists/delete'] = (input, actor) => this.commands.deleteList(input, actor);
	'users/lists/favorite': RelationshipsOperations<MiLocalUser>['users/lists/favorite'] = (input, actor) => this.commands.favorite(input, actor);
	'users/lists/pull': RelationshipsOperations<MiLocalUser>['users/lists/pull'] = (input, actor) => this.commands.pull(input, actor);
	'users/lists/push': RelationshipsOperations<MiLocalUser>['users/lists/push'] = (input, actor) => this.commands.push(input, actor);
	'users/lists/unfavorite': RelationshipsOperations<MiLocalUser>['users/lists/unfavorite'] = (input, actor) => this.commands.unfavorite(input, actor);
	'users/lists/update-membership': RelationshipsOperations<MiLocalUser>['users/lists/update-membership'] = (input, actor) => this.commands.updateMembership(input, actor);
}
