/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { packedUserLiteSchema, packedUserDetailedSchema } from '../../../users/backend/user.schema.js';
import { birthdaySelectorSchema } from './birthday.schema.js';
import { packedBlockingSchema, packedFollowingSchema, packedMutingSchema, packedRenoteMutingSchema, packedUserListSchema, packedUserRelationSchema } from './relationships.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const packedBlockingCreateInput = objectInput({
	'userId': misskeyId,
});

export const packedBlockingCreateOutput = packedUserDetailedSchema;

export const packedBlockingDeleteInput = objectInput({
	'userId': misskeyId,
});

export const packedBlockingDeleteOutput = packedUserDetailedSchema;

export const packedBlockingListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedBlockingListOutput = v.array(packedBlockingSchema);

export const packedFollowingCreateInput = objectInput({
	'userId': misskeyId,
	'withReplies': v.exactOptional(v.boolean()),
});

export const packedFollowingCreateOutput = packedUserLiteSchema;

export const packedFollowingDeleteInput = objectInput({
	'userId': misskeyId,
});

export const packedFollowingDeleteOutput = packedUserLiteSchema;

export const packedFollowingInvalidateInput = objectInput({
	'userId': misskeyId,
});

export const packedFollowingInvalidateOutput = packedUserLiteSchema;

export const packedFollowingListInput = objectInput({
	'notification': v.optional(v.boolean(), false),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});

export const packedFollowingListOutput = v.array(packedFollowingSchema);

export const followingRequestsAcceptInput = objectInput({ userId: misskeyId });

export const followingRequestsAcceptOutput = v.void();

export const packedFollowingRequestsCancelInput = objectInput({
	'userId': misskeyId,
});

export const packedFollowingRequestsCancelOutput = packedUserLiteSchema;

export const packedFollowingRequestsListInput = objectInput({
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});

export const packedFollowingRequestsListOutput = v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'follower': packedUserLiteSchema,
	'followee': packedUserLiteSchema,
}));

export const followingRequestsRejectInput = objectInput({ userId: misskeyId });

export const followingRequestsRejectOutput = v.void();

export const packedFollowingRequestsSentInput = objectInput({
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});

export const packedFollowingRequestsSentOutput = v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'follower': packedUserLiteSchema,
	'followee': packedUserLiteSchema,
}));

export const packedFollowingUpdateInput = objectInput({
	'userId': misskeyId,
	'notify': v.exactOptional(v.picklist(['normal', 'none'])),
	'withReplies': v.exactOptional(v.boolean()),
});

export const packedFollowingUpdateOutput = packedUserLiteSchema;

export const voidFollowingUpdateAllInput = objectInput({
	'notify': v.exactOptional(v.picklist(['normal', 'none'])),
	'withReplies': v.exactOptional(v.boolean()),
});

export const voidFollowingUpdateAllOutput = v.void();

export const voidMuteCreateInput = objectInput({
	'userId': misskeyId,
	'expiresAt': v.exactOptional(v.pipe(v.nullable(v.pipe(v.number(), v.integer())), v.metadata({ 'description': 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.' }))),
});

export const voidMuteCreateOutput = v.void();

export const muteDeleteInput = objectInput({ userId: misskeyId });

export const muteDeleteOutput = v.void();

export const packedMuteListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedMuteListOutput = v.array(packedMutingSchema);

export const renoteMuteCreateInput = objectInput({ userId: misskeyId });

export const renoteMuteCreateOutput = v.void();

export const renoteMuteDeleteInput = objectInput({ userId: misskeyId });

export const renoteMuteDeleteOutput = v.void();

export const packedRenoteMuteListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedRenoteMuteListOutput = v.array(packedRenoteMutingSchema);

const allOfUsersFollowersInputCommon = v.object({
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(v.number(), v.integer())),
	untilDate: v.optional(v.pipe(v.number(), v.integer())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
});

export const allOfUsersFollowersInput = v.union([objectInput({ userId: misskeyId, ...allOfUsersFollowersInputCommon.entries }), objectInput({ username: v.string(), host: v.nullable(v.string()), ...allOfUsersFollowersInputCommon.entries })]);

export const allOfUsersFollowersOutput = v.array(packedFollowingSchema);

const allOfUsersFollowingInputCommon = v.object({
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(v.number(), v.integer())),
	untilDate: v.optional(v.pipe(v.number(), v.integer())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	birthday: v.optional(v.pipe(v.nullable(v.pipe(v.string(), v.regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/))), v.metadata({ 'description': '@deprecated use get-following-users-by-birthday instead.' }))),
});

export const allOfUsersFollowingInput = v.union([objectInput({ userId: misskeyId, ...allOfUsersFollowingInputCommon.entries }), objectInput({ username: v.string(), host: v.nullable(v.string()), ...allOfUsersFollowingInputCommon.entries })]);

export const allOfUsersFollowingOutput = v.array(packedFollowingSchema);

export const birthdayUsersInput = objectInput({ limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10), offset: v.optional(v.pipe(v.number(), v.integer()), 0), birthday: birthdaySelectorSchema });

export const birthdayUsersOutput = v.array(v.strictObject({
	id: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })),
	birthday: v.string(),
	user: packedUserLiteSchema,
}));

export const packedUsersListsCreateInput = objectInput({
	'name': v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
});

export const packedUsersListsCreateOutput = packedUserListSchema;

export const packedUsersListsCreateFromPublicInput = objectInput({
	'name': v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	'listId': misskeyId,
});

export const packedUsersListsCreateFromPublicOutput = packedUserListSchema;

export const usersListsDeleteInput = objectInput({ listId: misskeyId });

export const usersListsDeleteOutput = v.void();

export const usersListsFavoriteInput = objectInput({ listId: misskeyId });

export const usersListsFavoriteOutput = v.void();

export const packedUsersListsGetMembershipsInput = objectInput({
	'listId': misskeyId,
	'forPublic': v.optional(v.boolean(), false),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedUsersListsGetMembershipsOutput = v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'misskey:id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'misskey:id' })),
	'user': packedUserLiteSchema,
	'withReplies': v.boolean(),
}));

export const packedUsersListsListInput = objectInput({
	'userId': v.exactOptional(misskeyId),
});

export const packedUsersListsListOutput = v.array(packedUserListSchema);

export const usersListsPullInput = objectInput({ listId: misskeyId, userId: misskeyId });

export const usersListsPullOutput = v.void();

export const usersListsPushInput = objectInput({ listId: misskeyId, userId: misskeyId });

export const usersListsPushOutput = v.void();

export const compositionUsersListsShowInput = objectInput({
	listId: misskeyId,
	forPublic: v.optional(v.boolean(), false),
});

export const compositionUsersListsShowOutput = v.strictObject({
	...packedUserListSchema.entries,
	likedCount: v.optional(v.number()),
	isLiked: v.optional(v.boolean()),
});

export const usersListsUnfavoriteInput = objectInput({ listId: misskeyId });

export const usersListsUnfavoriteOutput = v.void();

export const packedUsersListsUpdateInput = objectInput({
	'listId': misskeyId,
	'name': v.exactOptional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	'isPublic': v.exactOptional(v.boolean()),
});

export const packedUsersListsUpdateOutput = packedUserListSchema;

export const usersListsUpdateMembershipInput = objectInput({ listId: misskeyId, userId: misskeyId, withReplies: v.optional(v.boolean()) });

export const usersListsUpdateMembershipOutput = v.void();

export const unionUsersRelationInput = objectInput({ userId: v.union([misskeyId, v.array(misskeyId)]) });

export const unionUsersRelationOutput = v.array(packedUserRelationSchema);

export const BlockingCreateContract = oc.$meta<{ requestName: 'blocking/create' }>({ requestName: 'blocking/create' }).route({ method: 'POST', path: '/blocking/create', operationId: 'post___blocking___create', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, BLOCKEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_BLOCKING: { status: 400, data: apiErrorData } }).input(packedBlockingCreateInput).output(packedBlockingCreateOutput);

export const BlockingDeleteContract = oc.$meta<{ requestName: 'blocking/delete' }>({ requestName: 'blocking/delete' }).route({ method: 'POST', path: '/blocking/delete', operationId: 'post___blocking___delete', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, BLOCKEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_BLOCKING: { status: 400, data: apiErrorData } }).input(packedBlockingDeleteInput).output(packedBlockingDeleteOutput);

export const BlockingListContract = oc.$meta<{ requestName: 'blocking/list' }>({ requestName: 'blocking/list' }).route({ method: 'POST', path: '/blocking/list', operationId: 'post___blocking___list', tags: ['account'] }).errors({ ...commonErrors }).input(packedBlockingListInput).output(packedBlockingListOutput);

export const FollowingCreateContract = oc.$meta<{ requestName: 'following/create' }>({ requestName: 'following/create' }).route({ method: 'POST', path: '/following/create', operationId: 'post___following___create', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_FOLLOWING: { status: 400, data: apiErrorData }, BLOCKING: { status: 400, data: apiErrorData }, BLOCKED: { status: 400, data: apiErrorData } }).input(packedFollowingCreateInput).output(packedFollowingCreateOutput);

export const FollowingDeleteContract = oc.$meta<{ requestName: 'following/delete' }>({ requestName: 'following/delete' }).route({ method: 'POST', path: '/following/delete', operationId: 'post___following___delete', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_FOLLOWING: { status: 400, data: apiErrorData } }).input(packedFollowingDeleteInput).output(packedFollowingDeleteOutput);

export const FollowingInvalidateContract = oc.$meta<{ requestName: 'following/invalidate' }>({ requestName: 'following/invalidate' }).route({ method: 'POST', path: '/following/invalidate', operationId: 'post___following___invalidate', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWER_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_FOLLOWING: { status: 400, data: apiErrorData } }).input(packedFollowingInvalidateInput).output(packedFollowingInvalidateOutput);

export const FollowingListContract = oc.$meta<{ requestName: 'following/list' }>({ requestName: 'following/list' }).route({ method: 'POST', path: '/following/list', operationId: 'post___following___list', tags: ['users'] }).errors({ ...commonErrors }).input(packedFollowingListInput).output(packedFollowingListOutput);

export const FollowingRequestsAcceptContract = oc.$meta<{ requestName: 'following/requests/accept' }>({ requestName: 'following/requests/accept' }).route({ method: 'POST', path: '/following/requests/accept', operationId: 'post___following___requests___accept', tags: ['following', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, NO_FOLLOW_REQUEST: { status: 400, data: apiErrorData } }).input(followingRequestsAcceptInput).output(followingRequestsAcceptOutput);

export const FollowingRequestsCancelContract = oc.$meta<{ requestName: 'following/requests/cancel' }>({ requestName: 'following/requests/cancel' }).route({ method: 'POST', path: '/following/requests/cancel', operationId: 'post___following___requests___cancel', tags: ['following', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOW_REQUEST_NOT_FOUND: { status: 400, data: apiErrorData } }).input(packedFollowingRequestsCancelInput).output(packedFollowingRequestsCancelOutput);

export const FollowingRequestsListContract = oc.$meta<{ requestName: 'following/requests/list' }>({ requestName: 'following/requests/list' }).route({ method: 'POST', path: '/following/requests/list', operationId: 'post___following___requests___list', tags: ['following', 'account'] }).errors({ ...commonErrors }).input(packedFollowingRequestsListInput).output(packedFollowingRequestsListOutput);

export const FollowingRequestsRejectContract = oc.$meta<{ requestName: 'following/requests/reject' }>({ requestName: 'following/requests/reject' }).route({ method: 'POST', path: '/following/requests/reject', operationId: 'post___following___requests___reject', tags: ['following', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(followingRequestsRejectInput).output(followingRequestsRejectOutput);

export const FollowingRequestsSentContract = oc.$meta<{ requestName: 'following/requests/sent' }>({ requestName: 'following/requests/sent' }).route({ method: 'POST', path: '/following/requests/sent', operationId: 'post___following___requests___sent', tags: ['following', 'account'] }).errors({ ...commonErrors }).input(packedFollowingRequestsSentInput).output(packedFollowingRequestsSentOutput);

export const FollowingUpdateContract = oc.$meta<{ requestName: 'following/update' }>({ requestName: 'following/update' }).route({ method: 'POST', path: '/following/update', operationId: 'post___following___update', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_FOLLOWING: { status: 400, data: apiErrorData } }).input(packedFollowingUpdateInput).output(packedFollowingUpdateOutput);

export const FollowingUpdateAllContract = oc.$meta<{ requestName: 'following/update-all' }>({ requestName: 'following/update-all' }).route({ method: 'POST', path: '/following/update-all', operationId: 'post___following___update-all', tags: ['following', 'users'] }).errors({ ...commonErrors }).input(voidFollowingUpdateAllInput).output(voidFollowingUpdateAllOutput);

export const MuteCreateContract = oc.$meta<{ requestName: 'mute/create' }>({ requestName: 'mute/create' }).route({ method: 'POST', path: '/mute/create', operationId: 'post___mute___create', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_MUTING: { status: 400, data: apiErrorData } }).input(voidMuteCreateInput).output(voidMuteCreateOutput);

export const MuteDeleteContract = oc.$meta<{ requestName: 'mute/delete' }>({ requestName: 'mute/delete' }).route({ method: 'POST', path: '/mute/delete', operationId: 'post___mute___delete', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_MUTING: { status: 400, data: apiErrorData } }).input(muteDeleteInput).output(muteDeleteOutput);

export const MuteListContract = oc.$meta<{ requestName: 'mute/list' }>({ requestName: 'mute/list' }).route({ method: 'POST', path: '/mute/list', operationId: 'post___mute___list', tags: ['account'] }).errors({ ...commonErrors }).input(packedMuteListInput).output(packedMuteListOutput);

export const RenoteMuteCreateContract = oc.$meta<{ requestName: 'renote-mute/create' }>({ requestName: 'renote-mute/create' }).route({ method: 'POST', path: '/renote-mute/create', operationId: 'post___renote-mute___create', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_MUTING: { status: 400, data: apiErrorData } }).input(renoteMuteCreateInput).output(renoteMuteCreateOutput);

export const RenoteMuteDeleteContract = oc.$meta<{ requestName: 'renote-mute/delete' }>({ requestName: 'renote-mute/delete' }).route({ method: 'POST', path: '/renote-mute/delete', operationId: 'post___renote-mute___delete', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_MUTING: { status: 400, data: apiErrorData } }).input(renoteMuteDeleteInput).output(renoteMuteDeleteOutput);

export const RenoteMuteListContract = oc.$meta<{ requestName: 'renote-mute/list' }>({ requestName: 'renote-mute/list' }).route({ method: 'POST', path: '/renote-mute/list', operationId: 'post___renote-mute___list', tags: ['account'] }).errors({ ...commonErrors }).input(packedRenoteMuteListInput).output(packedRenoteMuteListOutput);

export const UsersFollowersContract = oc.$meta<{ requestName: 'users/followers' }>({ requestName: 'users/followers' }).route({ method: 'POST', path: '/users/followers', operationId: 'post___users___followers', tags: ['users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FORBIDDEN: { status: 400, data: apiErrorData } }).input(allOfUsersFollowersInput).output(allOfUsersFollowersOutput);

export const UsersFollowingContract = oc.$meta<{ requestName: 'users/following' }>({ requestName: 'users/following' }).route({ method: 'POST', path: '/users/following', operationId: 'post___users___following', tags: ['users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FORBIDDEN: { status: 400, data: apiErrorData }, BIRTHDAY_DATE_FORMAT_INVALID: { status: 400, data: apiErrorData } }).input(allOfUsersFollowingInput).output(allOfUsersFollowingOutput);

export const UsersGetFollowingUsersByBirthdayContract = oc.$meta<{ requestName: 'users/get-following-users-by-birthday' }>({ requestName: 'users/get-following-users-by-birthday' }).route({ method: 'POST', path: '/users/get-following-users-by-birthday', operationId: 'post___users___get-following-users-by-birthday', tags: ['users'] }).errors({ ...commonErrors }).input(birthdayUsersInput).output(birthdayUsersOutput);

export const UsersListsCreateContract = oc.$meta<{ requestName: 'users/lists/create' }>({ requestName: 'users/lists/create' }).route({ method: 'POST', path: '/users/lists/create', operationId: 'post___users___lists___create', tags: ['lists'] }).errors({ ...commonErrors, TOO_MANY_USERLISTS: { status: 400, data: apiErrorData } }).input(packedUsersListsCreateInput).output(packedUsersListsCreateOutput);

export const UsersListsCreateFromPublicContract = oc.$meta<{ requestName: 'users/lists/create-from-public' }>({ requestName: 'users/lists/create-from-public' }).route({ method: 'POST', path: '/users/lists/create-from-public', operationId: 'post___users___lists___create-from-public', tags: [] }).errors({ ...commonErrors, TOO_MANY_USERLISTS: { status: 400, data: apiErrorData }, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, ALREADY_ADDED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData }, TOO_MANY_USERS: { status: 400, data: apiErrorData } }).input(packedUsersListsCreateFromPublicInput).output(packedUsersListsCreateFromPublicOutput);

export const UsersListsDeleteContract = oc.$meta<{ requestName: 'users/lists/delete' }>({ requestName: 'users/lists/delete' }).route({ method: 'POST', path: '/users/lists/delete', operationId: 'post___users___lists___delete', tags: ['lists'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(usersListsDeleteInput).output(usersListsDeleteOutput);

export const UsersListsFavoriteContract = oc.$meta<{ requestName: 'users/lists/favorite' }>({ requestName: 'users/lists/favorite' }).route({ method: 'POST', path: '/users/lists/favorite', operationId: 'post___users___lists___favorite', tags: [] }).errors({ ...commonErrors, NO_SUCH_USER_LIST: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } }).input(usersListsFavoriteInput).output(usersListsFavoriteOutput);

export const UsersListsGetMembershipsContract = oc.$meta<{ requestName: 'users/lists/get-memberships' }>({ requestName: 'users/lists/get-memberships' }).route({ method: 'POST', path: '/users/lists/get-memberships', operationId: 'post___users___lists___get-memberships', tags: ['lists', 'account'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(packedUsersListsGetMembershipsInput).output(packedUsersListsGetMembershipsOutput);

export const UsersListsListContract = oc.$meta<{ requestName: 'users/lists/list' }>({ requestName: 'users/lists/list' }).route({ method: 'POST', path: '/users/lists/list', operationId: 'post___users___lists___list', tags: ['lists', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, REMOTE_USER_NOT_ALLOWED: { status: 400, data: apiErrorData }, INVALID_PARAM: { status: 400, data: apiErrorData } }).input(packedUsersListsListInput).output(packedUsersListsListOutput);

export const UsersListsPullContract = oc.$meta<{ requestName: 'users/lists/pull' }>({ requestName: 'users/lists/pull' }).route({ method: 'POST', path: '/users/lists/pull', operationId: 'post___users___lists___pull', tags: ['lists', 'users'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(usersListsPullInput).output(usersListsPullOutput);

export const UsersListsPushContract = oc.$meta<{ requestName: 'users/lists/push' }>({ requestName: 'users/lists/push' }).route({ method: 'POST', path: '/users/lists/push', operationId: 'post___users___lists___push', tags: ['lists', 'users'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, ALREADY_ADDED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData }, TOO_MANY_USERS: { status: 400, data: apiErrorData } }).input(usersListsPushInput).output(usersListsPushOutput);

export const UsersListsShowContract = oc.$meta<{ requestName: 'users/lists/show' }>({ requestName: 'users/lists/show' }).route({ method: 'POST', path: '/users/lists/show', operationId: 'post___users___lists___show', tags: ['lists', 'account'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(compositionUsersListsShowInput).output(compositionUsersListsShowOutput);

export const UsersListsUnfavoriteContract = oc.$meta<{ requestName: 'users/lists/unfavorite' }>({ requestName: 'users/lists/unfavorite' }).route({ method: 'POST', path: '/users/lists/unfavorite', operationId: 'post___users___lists___unfavorite', tags: [] }).errors({ ...commonErrors, NO_SUCH_USER_LIST: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } }).input(usersListsUnfavoriteInput).output(usersListsUnfavoriteOutput);

export const UsersListsUpdateContract = oc.$meta<{ requestName: 'users/lists/update' }>({ requestName: 'users/lists/update' }).route({ method: 'POST', path: '/users/lists/update', operationId: 'post___users___lists___update', tags: ['lists'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(packedUsersListsUpdateInput).output(packedUsersListsUpdateOutput);

export const UsersListsUpdateMembershipContract = oc.$meta<{ requestName: 'users/lists/update-membership' }>({ requestName: 'users/lists/update-membership' }).route({ method: 'POST', path: '/users/lists/update-membership', operationId: 'post___users___lists___update-membership', tags: ['lists', 'users'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(usersListsUpdateMembershipInput).output(usersListsUpdateMembershipOutput);

export const UsersRelationContract = oc.$meta<{ requestName: 'users/relation' }>({ requestName: 'users/relation' }).route({ method: 'POST', path: '/users/relation', operationId: 'post___users___relation', tags: ['users'] }).errors({ ...commonErrors }).input(unionUsersRelationInput).output(unionUsersRelationOutput);

export const relationshipsContract = {
	'blocking/create': BlockingCreateContract,
	'blocking/delete': BlockingDeleteContract,
	'blocking/list': BlockingListContract,
	'following/create': FollowingCreateContract,
	'following/delete': FollowingDeleteContract,
	'following/invalidate': FollowingInvalidateContract,
	'following/list': FollowingListContract,
	'following/requests/accept': FollowingRequestsAcceptContract,
	'following/requests/cancel': FollowingRequestsCancelContract,
	'following/requests/list': FollowingRequestsListContract,
	'following/requests/reject': FollowingRequestsRejectContract,
	'following/requests/sent': FollowingRequestsSentContract,
	'following/update': FollowingUpdateContract,
	'following/update-all': FollowingUpdateAllContract,
	'mute/create': MuteCreateContract,
	'mute/delete': MuteDeleteContract,
	'mute/list': MuteListContract,
	'renote-mute/create': RenoteMuteCreateContract,
	'renote-mute/delete': RenoteMuteDeleteContract,
	'renote-mute/list': RenoteMuteListContract,
	'users/followers': UsersFollowersContract,
	'users/following': UsersFollowingContract,
	'users/get-following-users-by-birthday': UsersGetFollowingUsersByBirthdayContract,
	'users/lists/create': UsersListsCreateContract,
	'users/lists/create-from-public': UsersListsCreateFromPublicContract,
	'users/lists/delete': UsersListsDeleteContract,
	'users/lists/favorite': UsersListsFavoriteContract,
	'users/lists/get-memberships': UsersListsGetMembershipsContract,
	'users/lists/list': UsersListsListContract,
	'users/lists/pull': UsersListsPullContract,
	'users/lists/push': UsersListsPushContract,
	'users/lists/show': UsersListsShowContract,
	'users/lists/unfavorite': UsersListsUnfavoriteContract,
	'users/lists/update': UsersListsUpdateContract,
	'users/lists/update-membership': UsersListsUpdateMembershipContract,
	'users/relation': UsersRelationContract,
} as const;
export type RelationshipsInputs = InferContractRouterInputs<typeof relationshipsContract>;
export type RelationshipsOutputs = InferContractRouterOutputs<typeof relationshipsContract>;
