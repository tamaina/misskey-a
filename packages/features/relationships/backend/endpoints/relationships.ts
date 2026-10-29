/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { relationshipsContract } from './relationships.contract.js';
import type { RelationshipsDependencies } from '../api.implementation.js';
import { createBlockingCreateProcedure } from './blocking/create.js';
import { createBlockingDeleteProcedure } from './blocking/delete.js';
import { createBlockingListProcedure } from './blocking/list.js';
import { createFollowingCreateProcedure } from './following/create.js';
import { createFollowingDeleteProcedure } from './following/delete.js';
import { createFollowingInvalidateProcedure } from './following/invalidate.js';
import { createFollowingListProcedure } from './following/list.js';
import { createFollowingRequestsAcceptProcedure } from './following/requests/accept.js';
import { createFollowingRequestsCancelProcedure } from './following/requests/cancel.js';
import { createFollowingRequestsListProcedure } from './following/requests/list.js';
import { createFollowingRequestsRejectProcedure } from './following/requests/reject.js';
import { createFollowingRequestsSentProcedure } from './following/requests/sent.js';
import { createFollowingUpdateProcedure } from './following/update.js';
import { createFollowingUpdateAllProcedure } from './following/update-all.js';
import { createMuteCreateProcedure } from './mute/create.js';
import { createMuteDeleteProcedure } from './mute/delete.js';
import { createMuteListProcedure } from './mute/list.js';
import { createRenoteMuteCreateProcedure } from './renote-mute/create.js';
import { createRenoteMuteDeleteProcedure } from './renote-mute/delete.js';
import { createRenoteMuteListProcedure } from './renote-mute/list.js';
import { createUsersFollowersProcedure } from './users/followers.js';
import { createUsersFollowingProcedure } from './users/following.js';
import { createUsersGetFollowingUsersByBirthdayProcedure } from './users/get-following-users-by-birthday.js';
import { createUsersListsCreateProcedure } from './users/lists/create.js';
import { createUsersListsCreateFromPublicProcedure } from './users/lists/create-from-public.js';
import { createUsersListsDeleteProcedure } from './users/lists/delete.js';
import { createUsersListsFavoriteProcedure } from './users/lists/favorite.js';
import { createUsersListsGetMembershipsProcedure } from './users/lists/get-memberships.js';
import { createUsersListsListProcedure } from './users/lists/list.js';
import { createUsersListsPullProcedure } from './users/lists/pull.js';
import { createUsersListsPushProcedure } from './users/lists/push.js';
import { createUsersListsShowProcedure } from './users/lists/show.js';
import { createUsersListsUnfavoriteProcedure } from './users/lists/unfavorite.js';
import { createUsersListsUpdateProcedure } from './users/lists/update.js';
import { createUsersListsUpdateMembershipProcedure } from './users/lists/update-membership.js';
import { createUsersRelationProcedure } from './users/relation.js';
export function createRelationshipsRouter<Actor extends MiLocalUser>(deps: RelationshipsDependencies) {
	return implement(relationshipsContract).$context<ApiContext<Actor>>().router({
		"blocking/create": createBlockingCreateProcedure<Actor>(deps),
		"blocking/delete": createBlockingDeleteProcedure<Actor>(deps),
		"blocking/list": createBlockingListProcedure<Actor>(deps),
		"following/create": createFollowingCreateProcedure<Actor>(deps),
		"following/delete": createFollowingDeleteProcedure<Actor>(deps),
		"following/invalidate": createFollowingInvalidateProcedure<Actor>(deps),
		"following/list": createFollowingListProcedure<Actor>(deps),
		"following/requests/accept": createFollowingRequestsAcceptProcedure<Actor>(deps),
		"following/requests/cancel": createFollowingRequestsCancelProcedure<Actor>(deps),
		"following/requests/list": createFollowingRequestsListProcedure<Actor>(deps),
		"following/requests/reject": createFollowingRequestsRejectProcedure<Actor>(deps),
		"following/requests/sent": createFollowingRequestsSentProcedure<Actor>(deps),
		"following/update": createFollowingUpdateProcedure<Actor>(deps),
		"following/update-all": createFollowingUpdateAllProcedure<Actor>(deps),
		"mute/create": createMuteCreateProcedure<Actor>(deps),
		"mute/delete": createMuteDeleteProcedure<Actor>(deps),
		"mute/list": createMuteListProcedure<Actor>(deps),
		"renote-mute/create": createRenoteMuteCreateProcedure<Actor>(deps),
		"renote-mute/delete": createRenoteMuteDeleteProcedure<Actor>(deps),
		"renote-mute/list": createRenoteMuteListProcedure<Actor>(deps),
		"users/followers": createUsersFollowersProcedure<Actor>(deps),
		"users/following": createUsersFollowingProcedure<Actor>(deps),
		"users/get-following-users-by-birthday": createUsersGetFollowingUsersByBirthdayProcedure<Actor>(deps),
		"users/lists/create": createUsersListsCreateProcedure<Actor>(deps),
		"users/lists/create-from-public": createUsersListsCreateFromPublicProcedure<Actor>(deps),
		"users/lists/delete": createUsersListsDeleteProcedure<Actor>(deps),
		"users/lists/favorite": createUsersListsFavoriteProcedure<Actor>(deps),
		"users/lists/get-memberships": createUsersListsGetMembershipsProcedure<Actor>(deps),
		"users/lists/list": createUsersListsListProcedure<Actor>(deps),
		"users/lists/pull": createUsersListsPullProcedure<Actor>(deps),
		"users/lists/push": createUsersListsPushProcedure<Actor>(deps),
		"users/lists/show": createUsersListsShowProcedure<Actor>(deps),
		"users/lists/unfavorite": createUsersListsUnfavoriteProcedure<Actor>(deps),
		"users/lists/update": createUsersListsUpdateProcedure<Actor>(deps),
		"users/lists/update-membership": createUsersListsUpdateMembershipProcedure<Actor>(deps),
		"users/relation": createUsersRelationProcedure<Actor>(deps),
	});
}
