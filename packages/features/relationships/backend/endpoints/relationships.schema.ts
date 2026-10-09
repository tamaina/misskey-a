/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { toPackedUserDetailed, type UserDetailedWireInput } from '../../../users/backend/user.schema.js';
import {
	packedUserDetailedSchema,
	packedUserDetailedSchema as __ref_UserDetailedNotMe,
} from '../../../users/backend/user.schema.js';

export const packedBlockingSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'blockeeId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'blockee': v.lazy(() => __ref_UserDetailedNotMe),
});
export const packedFollowingSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'followeeId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'followerId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'followee': v.optional(packedUserDetailedSchema),
	'follower': v.optional(packedUserDetailedSchema),
});
export const packedMutingSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'expiresAt': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' })),
	'muteeId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'mutee': v.lazy(() => __ref_UserDetailedNotMe),
});
export const packedRenoteMutingSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'muteeId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'mutee': v.lazy(() => __ref_UserDetailedNotMe),
});
export const packedUserListSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'name': v.string(),
	'userIds': v.optional(v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' })))),
	'isPublic': v.boolean(),
});

// getRelation returns this selected persistence row as part of its public JSON result.
export const packedRelationFollowingSchema = v.strictObject({
	id: v.string(), followeeId: v.string(), followerId: v.string(),
	isFollowerHibernated: v.boolean(), isFollowerSuspended: v.boolean(),
	withReplies: v.boolean(), notify: v.nullable(v.literal('normal')),
	followerHost: v.nullable(v.string()), followerInbox: v.nullable(v.string()), followerSharedInbox: v.nullable(v.string()),
	followeeHost: v.nullable(v.string()), followeeInbox: v.nullable(v.string()), followeeSharedInbox: v.nullable(v.string()),
});
export const packedUserRelationSchema = v.strictObject({
	id: v.string(), following: v.nullable(packedRelationFollowingSchema),
	isFollowing: v.boolean(), isFollowed: v.boolean(),
	hasPendingFollowRequestFromYou: v.boolean(), hasPendingFollowRequestToYou: v.boolean(),
	isBlocking: v.boolean(), isBlocked: v.boolean(), isMuted: v.boolean(), isRenoteMuted: v.boolean(),
});

type FollowingWireInput = Omit<v.InferOutput<typeof packedFollowingSchema>, 'followee' | 'follower'> & {
	followee?: UserDetailedWireInput | undefined;
	follower?: UserDetailedWireInput | undefined;
};
export function toPackedFollowing(following: FollowingWireInput): v.InferOutput<typeof packedFollowingSchema> {
	return {
		id: following.id, createdAt: following.createdAt, followeeId: following.followeeId, followerId: following.followerId,
		...(following.followee === undefined ? {} : { followee: toPackedUserDetailed(following.followee) }),
		...(following.follower === undefined ? {} : { follower: toPackedUserDetailed(following.follower) }),
	};
}
export function toPackedUserRelation(relation: v.InferOutput<typeof packedUserRelationSchema>): v.InferOutput<typeof packedUserRelationSchema> {
	const following = relation.following;
	return {
		...relation,
		following: following === null ? null : {
			id: following.id, followeeId: following.followeeId, followerId: following.followerId,
			isFollowerHibernated: following.isFollowerHibernated, isFollowerSuspended: following.isFollowerSuspended,
			withReplies: following.withReplies, notify: following.notify,
			followerHost: following.followerHost, followerInbox: following.followerInbox, followerSharedInbox: following.followerSharedInbox,
			followeeHost: following.followeeHost, followeeInbox: following.followeeInbox, followeeSharedInbox: following.followeeSharedInbox,
		},
	};
}
