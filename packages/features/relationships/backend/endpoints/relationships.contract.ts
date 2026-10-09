/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { packedUserLiteSchema, packedUserDetailedSchema } from '../../../users/backend/user.schema.js';
import type { BirthdaySelector } from './birthday.schema.js';
import { packedJsonValueSchema, type PackedJsonValue } from '../../../users/backend/json-value.schema.js';
import { packedBlockingSchema, packedFollowingSchema, packedMutingSchema, packedRenoteMutingSchema, packedUserListSchema, packedUserRelationSchema } from './relationships.schema.js';
const birthdayMonth = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(12));
const birthdayDay = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(31));
const birthdayDate = objectInput({ month: birthdayMonth, day: birthdayDay });

function isBirthdayDate(input: PackedJsonValue | undefined): boolean {
	return input !== null && typeof input === 'object' && !Array.isArray(input)
		&& typeof input.month === 'number' && Number.isInteger(input.month) && input.month >= 1 && input.month <= 12
		&& typeof input.day === 'number' && Number.isInteger(input.day) && input.day >= 1 && input.day <= 31;
}

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const allOfUsersFollowersInputCommon = {
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(v.number(), v.integer())),
	untilDate: v.optional(v.pipe(v.number(), v.integer())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
};

const allOfUsersFollowingInputCommon = {
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(v.number(), v.integer())),
	untilDate: v.optional(v.pipe(v.number(), v.integer())),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	birthday: v.optional(v.pipe(v.nullable(v.pipe(v.string(), v.regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/))), v.metadata({ 'description': '@deprecated use get-following-users-by-birthday instead.' }))),
};

export const BlockingCreateContract = oc.$meta({ requestName: 'blocking/create' } as const).route({ method: 'POST', path: '/blocking/create', operationId: 'post___blocking___create', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, BLOCKEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_BLOCKING: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
})).output(packedUserDetailedSchema);

export const BlockingDeleteContract = oc.$meta({ requestName: 'blocking/delete' } as const).route({ method: 'POST', path: '/blocking/delete', operationId: 'post___blocking___delete', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, BLOCKEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_BLOCKING: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
})).output(packedUserDetailedSchema);

export const BlockingListContract = oc.$meta({ requestName: 'blocking/list' } as const).route({ method: 'POST', path: '/blocking/list', operationId: 'post___blocking___list', tags: ['account'] }).errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(packedBlockingSchema));

export const FollowingCreateContract = oc.$meta({ requestName: 'following/create' } as const).route({ method: 'POST', path: '/following/create', operationId: 'post___following___create', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_FOLLOWING: { status: 400, data: apiErrorData }, BLOCKING: { status: 400, data: apiErrorData }, BLOCKED: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
	'withReplies': v.exactOptional(v.boolean()),
})).output(packedUserLiteSchema);

export const FollowingDeleteContract = oc.$meta({ requestName: 'following/delete' } as const).route({ method: 'POST', path: '/following/delete', operationId: 'post___following___delete', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_FOLLOWING: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
})).output(packedUserLiteSchema);

export const FollowingInvalidateContract = oc.$meta({ requestName: 'following/invalidate' } as const).route({ method: 'POST', path: '/following/invalidate', operationId: 'post___following___invalidate', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWER_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_FOLLOWING: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
})).output(packedUserLiteSchema);

export const FollowingListContract = oc.$meta({ requestName: 'following/list' } as const).route({ method: 'POST', path: '/following/list', operationId: 'post___following___list', tags: ['users'] }).errors({ ...commonErrors }).input(objectInput({
	'notification': v.optional(v.boolean(), false),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
})).output(v.array(packedFollowingSchema));

export const FollowingRequestsAcceptContract = oc.$meta({ requestName: 'following/requests/accept' } as const).route({ method: 'POST', path: '/following/requests/accept', operationId: 'post___following___requests___accept', tags: ['following', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, NO_FOLLOW_REQUEST: { status: 400, data: apiErrorData } }).input(objectInput({ userId: misskeyId })).output(v.void());

export const FollowingRequestsCancelContract = oc.$meta({ requestName: 'following/requests/cancel' } as const).route({ method: 'POST', path: '/following/requests/cancel', operationId: 'post___following___requests___cancel', tags: ['following', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOW_REQUEST_NOT_FOUND: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
})).output(packedUserLiteSchema);

export const FollowingRequestsListContract = oc.$meta({ requestName: 'following/requests/list' } as const).route({ method: 'POST', path: '/following/requests/list', operationId: 'post___following___requests___list', tags: ['following', 'account'] }).errors({ ...commonErrors }).input(objectInput({
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
})).output(v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'follower': packedUserLiteSchema,
	'followee': packedUserLiteSchema,
})));

export const FollowingRequestsRejectContract = oc.$meta({ requestName: 'following/requests/reject' } as const).route({ method: 'POST', path: '/following/requests/reject', operationId: 'post___following___requests___reject', tags: ['following', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(objectInput({ userId: misskeyId })).output(v.void());

export const FollowingRequestsSentContract = oc.$meta({ requestName: 'following/requests/sent' } as const).route({ method: 'POST', path: '/following/requests/sent', operationId: 'post___following___requests___sent', tags: ['following', 'account'] }).errors({ ...commonErrors }).input(objectInput({
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
})).output(v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'follower': packedUserLiteSchema,
	'followee': packedUserLiteSchema,
})));

export const FollowingUpdateContract = oc.$meta({ requestName: 'following/update' } as const).route({ method: 'POST', path: '/following/update', operationId: 'post___following___update', tags: ['following', 'users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FOLLOWEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_FOLLOWING: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
	'notify': v.exactOptional(v.picklist(['normal', 'none'])),
	'withReplies': v.exactOptional(v.boolean()),
})).output(packedUserLiteSchema);

export const FollowingUpdateAllContract = oc.$meta({ requestName: 'following/update-all' } as const).route({ method: 'POST', path: '/following/update-all', operationId: 'post___following___update-all', tags: ['following', 'users'] }).errors({ ...commonErrors }).input(objectInput({
	'notify': v.exactOptional(v.picklist(['normal', 'none'])),
	'withReplies': v.exactOptional(v.boolean()),
})).output(v.void());

export const MuteCreateContract = oc.$meta({ requestName: 'mute/create' } as const).route({ method: 'POST', path: '/mute/create', operationId: 'post___mute___create', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_MUTING: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
	'expiresAt': v.exactOptional(v.pipe(v.nullable(v.pipe(v.number(), v.integer())), v.metadata({ 'description': 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.' }))),
})).output(v.void());

export const MuteDeleteContract = oc.$meta({ requestName: 'mute/delete' } as const).route({ method: 'POST', path: '/mute/delete', operationId: 'post___mute___delete', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_MUTING: { status: 400, data: apiErrorData } }).input(objectInput({ userId: misskeyId })).output(v.void());

export const MuteListContract = oc.$meta({ requestName: 'mute/list' } as const).route({ method: 'POST', path: '/mute/list', operationId: 'post___mute___list', tags: ['account'] }).errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(packedMutingSchema));

export const RenoteMuteCreateContract = oc.$meta({ requestName: 'renote-mute/create' } as const).route({ method: 'POST', path: '/renote-mute/create', operationId: 'post___renote-mute___create', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, ALREADY_MUTING: { status: 400, data: apiErrorData } }).input(objectInput({ userId: misskeyId })).output(v.void());

export const RenoteMuteDeleteContract = oc.$meta({ requestName: 'renote-mute/delete' } as const).route({ method: 'POST', path: '/renote-mute/delete', operationId: 'post___renote-mute___delete', tags: ['account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, MUTEE_IS_YOURSELF: { status: 400, data: apiErrorData }, NOT_MUTING: { status: 400, data: apiErrorData } }).input(objectInput({ userId: misskeyId })).output(v.void());

export const RenoteMuteListContract = oc.$meta({ requestName: 'renote-mute/list' } as const).route({ method: 'POST', path: '/renote-mute/list', operationId: 'post___renote-mute___list', tags: ['account'] }).errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(packedRenoteMutingSchema));

export const UsersFollowersContract = oc.$meta({ requestName: 'users/followers' } as const).route({ method: 'POST', path: '/users/followers', operationId: 'post___users___followers', tags: ['users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FORBIDDEN: { status: 400, data: apiErrorData } }).input(v.union([objectInput({ userId: misskeyId, ...allOfUsersFollowersInputCommon }), objectInput({ username: v.string(), host: v.nullable(v.string()), ...allOfUsersFollowersInputCommon })])).output(v.array(packedFollowingSchema));

export const UsersFollowingContract = oc.$meta({ requestName: 'users/following' } as const).route({ method: 'POST', path: '/users/following', operationId: 'post___users___following', tags: ['users'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, FORBIDDEN: { status: 400, data: apiErrorData }, BIRTHDAY_DATE_FORMAT_INVALID: { status: 400, data: apiErrorData } }).input(v.union([objectInput({ userId: misskeyId, ...allOfUsersFollowingInputCommon }), objectInput({ username: v.string(), host: v.nullable(v.string()), ...allOfUsersFollowingInputCommon })])).output(v.array(packedFollowingSchema));

export const UsersGetFollowingUsersByBirthdayContract = oc.$meta({ requestName: 'users/get-following-users-by-birthday' } as const).route({ method: 'POST', path: '/users/get-following-users-by-birthday', operationId: 'post___users___get-following-users-by-birthday', tags: ['users'] }).errors({ ...commonErrors }).input<v.GenericSchema<{ limit?: number | undefined; offset?: number | undefined; birthday: BirthdaySelector }, { limit: number; offset: number; birthday: BirthdaySelector }>>(objectInput({ limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10), offset: v.optional(v.pipe(v.number(), v.integer()), 0), birthday: v.union([
	v.pipe(objectInput({ month: birthdayMonth, day: birthdayDay, begin: v.exactOptional(packedJsonValueSchema), end: v.exactOptional(packedJsonValueSchema) }),
		v.check(input => !(isBirthdayDate(input.begin) && isBirthdayDate(input.end)), 'Birthday must select exactly one date shape')),
	v.pipe(objectInput({ begin: birthdayDate, end: birthdayDate, month: v.exactOptional(packedJsonValueSchema), day: v.exactOptional(packedJsonValueSchema) }),
		v.check(input => !(typeof input.month === 'number' && Number.isInteger(input.month) && input.month >= 1 && input.month <= 12
			&& typeof input.day === 'number' && Number.isInteger(input.day) && input.day >= 1 && input.day <= 31), 'Birthday must select exactly one date shape')),
]) })).output(v.array(v.strictObject({
	id: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })),
	birthday: v.string(),
	user: packedUserLiteSchema,
})));

export const UsersListsCreateContract = oc.$meta({ requestName: 'users/lists/create' } as const).route({ method: 'POST', path: '/users/lists/create', operationId: 'post___users___lists___create', tags: ['lists'] }).errors({ ...commonErrors, TOO_MANY_USERLISTS: { status: 400, data: apiErrorData } }).input(objectInput({
	'name': v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
})).output(packedUserListSchema);

export const UsersListsCreateFromPublicContract = oc.$meta({ requestName: 'users/lists/create-from-public' } as const).route({ method: 'POST', path: '/users/lists/create-from-public', operationId: 'post___users___lists___create-from-public', tags: [] }).errors({ ...commonErrors, TOO_MANY_USERLISTS: { status: 400, data: apiErrorData }, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, ALREADY_ADDED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData }, TOO_MANY_USERS: { status: 400, data: apiErrorData } }).input(objectInput({
	'name': v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	'listId': misskeyId,
})).output(packedUserListSchema);

export const UsersListsDeleteContract = oc.$meta({ requestName: 'users/lists/delete' } as const).route({ method: 'POST', path: '/users/lists/delete', operationId: 'post___users___lists___delete', description: 'Delete an existing list of users.', tags: ['lists'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(objectInput({ listId: misskeyId })).output(v.void());

export const UsersListsFavoriteContract = oc.$meta({ requestName: 'users/lists/favorite' } as const).route({ method: 'POST', path: '/users/lists/favorite', operationId: 'post___users___lists___favorite', tags: [] }).errors({ ...commonErrors, NO_SUCH_USER_LIST: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } }).input(objectInput({ listId: misskeyId })).output(v.void());

export const UsersListsGetMembershipsContract = oc.$meta({ requestName: 'users/lists/get-memberships' } as const).route({ method: 'POST', path: '/users/lists/get-memberships', operationId: 'post___users___lists___get-memberships', tags: ['lists', 'account'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(objectInput({
	'listId': misskeyId,
	'forPublic': v.optional(v.boolean(), false),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'misskey:id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'misskey:id' })),
	'user': packedUserLiteSchema,
	'withReplies': v.boolean(),
})));

export const UsersListsListContract = oc.$meta({ requestName: 'users/lists/list' } as const).route({ method: 'POST', path: '/users/lists/list', operationId: 'post___users___lists___list', tags: ['lists', 'account'] }).errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, REMOTE_USER_NOT_ALLOWED: { status: 400, data: apiErrorData }, INVALID_PARAM: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': v.exactOptional(misskeyId),
})).output(v.array(packedUserListSchema));

export const UsersListsPullContract = oc.$meta({ requestName: 'users/lists/pull' } as const).route({ method: 'POST', path: '/users/lists/pull', operationId: 'post___users___lists___pull', description: 'Remove a user from a list.', tags: ['lists', 'users'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(objectInput({ listId: misskeyId, userId: misskeyId })).output(v.void());

export const UsersListsPushContract = oc.$meta({ requestName: 'users/lists/push' } as const).route({ method: 'POST', path: '/users/lists/push', operationId: 'post___users___lists___push', description: 'Add a user to an existing list.', tags: ['lists', 'users'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, ALREADY_ADDED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData }, TOO_MANY_USERS: { status: 400, data: apiErrorData } }).input(objectInput({ listId: misskeyId, userId: misskeyId })).output(v.void());

export const UsersListsShowContract = oc.$meta({ requestName: 'users/lists/show' } as const).route({ method: 'POST', path: '/users/lists/show', operationId: 'post___users___lists___show', tags: ['lists', 'account'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(objectInput({
	listId: misskeyId,
	forPublic: v.optional(v.boolean(), false),
})).output(v.strictObject({
	...packedUserListSchema.entries,
	likedCount: v.optional(v.number()),
	isLiked: v.optional(v.boolean()),
}));

export const UsersListsUnfavoriteContract = oc.$meta({ requestName: 'users/lists/unfavorite' } as const).route({ method: 'POST', path: '/users/lists/unfavorite', operationId: 'post___users___lists___unfavorite', tags: [] }).errors({ ...commonErrors, NO_SUCH_USER_LIST: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } }).input(objectInput({ listId: misskeyId })).output(v.void());

export const UsersListsUpdateContract = oc.$meta({ requestName: 'users/lists/update' } as const).route({ method: 'POST', path: '/users/lists/update', operationId: 'post___users___lists___update', tags: ['lists'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } }).input(objectInput({
	'listId': misskeyId,
	'name': v.exactOptional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	'isPublic': v.exactOptional(v.boolean()),
})).output(packedUserListSchema);

export const UsersListsUpdateMembershipContract = oc.$meta({ requestName: 'users/lists/update-membership' } as const).route({ method: 'POST', path: '/users/lists/update-membership', operationId: 'post___users___lists___update-membership', tags: ['lists', 'users'] }).errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(objectInput({ listId: misskeyId, userId: misskeyId, withReplies: v.optional(v.boolean()) })).output(v.void());

export const UsersRelationContract = oc.$meta({ requestName: 'users/relation' } as const).route({ method: 'POST', path: '/users/relation', operationId: 'post___users___relation', tags: ['users'] }).errors({ ...commonErrors }).input(objectInput({ userId: v.union([misskeyId, v.array(misskeyId)]) })).output(v.array(packedUserRelationSchema));

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
