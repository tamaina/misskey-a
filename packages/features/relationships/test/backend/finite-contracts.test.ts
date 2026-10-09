/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedFollowingSchema, packedBlockingSchema, packedMutingSchema, packedRenoteMutingSchema, packedUserListSchema } from '../../backend/endpoints/relationships.schema.js';
import { UsersListsShowContract, FollowingRequestsListContract, UsersListsGetMembershipsContract, UsersRelationContract } from '../../backend/endpoints/relationships.contract.js';
import { FollowingEntityService } from '../../backend/serializers/FollowingEntityService.js';
import { BlockingEntityService } from '../../backend/serializers/BlockingEntityService.js';
import { MutingEntityService } from '../../backend/serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from '../../backend/serializers/RenoteMutingEntityService.js';
import { FollowRequestEntityService } from '../../backend/serializers/FollowRequestEntityService.js';
import { UserListEntityService } from '../../backend/serializers/UserListEntityService.js';
import { UsersListsShowOperation as ListShow } from '../../backend/endpoints/users/lists/show.js';
import { packedUserRelationSchema as unionUsersRelationModel } from '../../backend/endpoints/relationships.schema.js';
import { UsersRelationOperation as Relation } from '../../backend/endpoints/users/relation.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiFollowing } from '../../backend/models/Following.js';
import type { MiBlocking } from '../../backend/models/Blocking.js';
import type { MiMuting } from '../../backend/models/Muting.js';
import type { MiRenoteMuting } from '../../backend/models/RenoteMuting.js';
import type { MiFollowRequest } from '../../backend/models/FollowRequest.js';
import type { MiUserList } from '../../backend/models/UserList.js';
import type { MiUserListMembership } from '../../backend/models/UserListMembership.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native schema');
	return schema;
}

const compositionUsersListsShowOutput = requiredSchema(UsersListsShowContract['~orpc'].outputSchema);
const packedFollowingRequestsListInput = requiredSchema(FollowingRequestsListContract['~orpc'].inputSchema);
const packedFollowingRequestsListOutput = requiredSchema(FollowingRequestsListContract['~orpc'].outputSchema);
const packedUsersListsGetMembershipsOutput = requiredSchema(UsersListsGetMembershipsContract['~orpc'].outputSchema);
const unionUsersRelationOutput = requiredSchema(UsersRelationContract['~orpc'].outputSchema);

const date = new Date('2026-01-01T00:00:00Z');

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };
const detailedUser = { ...user, url: null, uri: null, movedTo: null, alsoKnownAs: null, createdAt: date.toISOString(), updatedAt: null, lastFetchedAt: null, bannerUrl: null, bannerBlurhash: null, isLocked: false, isSilenced: false, isSuspended: false, description: null, location: null, birthday: null, lang: null, fields: [], verifiedLinks: [], followersCount: 0, followingCount: 0, notesCount: 0, pinnedNoteIds: [], pinnedNotes: [], pinnedPageId: null, pinnedPage: null, publicReactions: false, followingVisibility: 'public' as const, followersVisibility: 'public' as const, chatScope: 'everyone' as const, canChat: true, roles: [], memo: null };

test.each([false, true])('actual Following producer permits own undefined and populated sides: %s', async populated => {
	const users = mockDeep<ConstructorParameters<typeof FollowingEntityService>[1]>();
	users.pack.mockResolvedValue(detailedUser);
	const ids = mockDeep<ConstructorParameters<typeof FollowingEntityService>[2]>();
	ids.parse.mockReturnValue({ date });
	const service = new FollowingEntityService(mockDeep(), users, ids);
	const output = await service.pack(mockDeep<MiFollowing>({ id: 'following123', followerId: 'follower123', followeeId: user.id, follower: null, followee: null }), null, { populateFollowee: populated });
	checkClosed(packedFollowingSchema, output, 'followeeId', { followerId: 1 });
	expect(Object.hasOwn(output, 'follower')).toBe(true);
	expect(output.follower).toBeUndefined();
	expect(output.followee).toEqual(populated ? detailedUser : undefined);
});

test('actual blocking and mute producers validate fixed wrappers and nullable expiry', async () => {
	const users = mockDeep<ConstructorParameters<typeof BlockingEntityService>[1]>();
	users.pack.mockResolvedValue(detailedUser);
	const ids = mockDeep<ConstructorParameters<typeof BlockingEntityService>[2]>();
	ids.parse.mockReturnValue({ date });
	const blocking = await new BlockingEntityService(mockDeep(), users, ids).pack(mockDeep<MiBlocking>({ id: 'blocking123', blockeeId: user.id }));
	checkClosed(packedBlockingSchema, blocking, 'blockeeId', { createdAt: 1 });
	const muting = new MutingEntityService(mockDeep(), users, ids);
	for (const expiresAt of [null, date]) {
		const output = await muting.pack(mockDeep<MiMuting>({ id: 'muting123', muteeId: user.id, expiresAt }));
		checkClosed(packedMutingSchema, output, 'expiresAt', { expiresAt: 1 });
		expect(output.expiresAt).toBe(expiresAt?.toISOString() ?? null);
	}
	const renote = await new RenoteMutingEntityService(mockDeep(), users, ids).pack(mockDeep<MiRenoteMuting>({ id: 'renote123', muteeId: user.id }));
	checkClosed(packedRenoteMutingSchema, renote, 'muteeId', { id: 1 });
});

test('actual request and membership producers validate strict array items', async () => {
	const users = mockDeep<ConstructorParameters<typeof FollowRequestEntityService>[1]>();
	users.pack.mockResolvedValue(user);
	users.packMany.mockResolvedValue([user]);
	const request = await new FollowRequestEntityService(mockDeep(), users).pack(mockDeep<MiFollowRequest>({ id: 'request123', followerId: user.id, followeeId: user.id }));
	checkClosed(packedFollowingRequestsListOutput.item, request, 'followee', { id: 1 });
	const ids = mockDeep<ConstructorParameters<typeof UserListEntityService>[3]>();
	ids.parse.mockReturnValue({ date });
	const service = new UserListEntityService(mockDeep(), mockDeep(), users, ids);
	const [membership] = await service.packMembershipsMany([mockDeep<MiUserListMembership>({ id: 'membership123', userId: user.id, user: null, withReplies: false })]);
	checkClosed(packedUsersListsGetMembershipsOutput.item, membership, 'withReplies', { userId: 1 });
});

test.each([false, true])('actual list serializer and show handler validate flattened private/public fields: %s', async forPublic => {
	const lists = mockDeep<ConstructorParameters<typeof ListShow>[0]>();
	const favorites = mockDeep<ConstructorParameters<typeof ListShow>[1]>();
	favorites.countBy.mockResolvedValue(4);
	const memberships = mockDeep<ConstructorParameters<typeof UserListEntityService>[1]>();
	memberships.findBy.mockResolvedValue([]);
	const ids = mockDeep<ConstructorParameters<typeof UserListEntityService>[3]>();
	ids.parse.mockReturnValue({ date });
	const list = mockDeep<MiUserList>({ id: 'list123', name: 'friends', isPublic: true });
	lists.findOneBy.mockResolvedValue(list);
	const serializer = new UserListEntityService(lists, memberships, mockDeep(), ids);
	checkClosed(packedUserListSchema, await serializer.pack(list), 'name', { isPublic: 1 });
	const output = await new ListShow(lists, favorites, serializer).execute({ listId: list.id, forPublic }, null);
	checkClosed(compositionUsersListsShowOutput, output, 'name', { likedCount: '4' });
	expect(output.likedCount).toBe(forPublic ? 4 : undefined);
	expect(output.isLiked).toBe(forPublic ? false : undefined);
});

test('native relationships inputs project known fields and reject malformed pagination/response values', () => {
	expect(v.parse(packedFollowingRequestsListInput, { future: true })).toEqual({ limit: 10 });
	for (const value of [null, [], { limit: 0 }, { limit: '10' }, { sinceId: '-' }]) expect(v.safeParse(packedFollowingRequestsListInput, value).success).toBe(false);
	const response = [{ id: 'request123', follower: user, followee: user, future: true }];
	expect(v.safeParse(packedFollowingRequestsListOutput, response).success).toBe(false);
});

test('actual relation handler preserves the single-id array branch and producer following field', async () => {
	const users = mockDeep<ConstructorParameters<typeof Relation>[0]>();
	const relation = { id: user.id, following: null, isFollowing: false, hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false, isFollowed: false, isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false };
	users.getRelation.mockResolvedValue(relation);
	const endpoint = new Relation(users);
	const output = await endpoint.execute({ userId: user.id }, mockDeep<MiLocalUser>({ id: 'viewer123' }));
	expect(output).toEqual([relation]);
	expect(v.parse(unionUsersRelationOutput, output)).toEqual([relation]);
	expect(v.parse(unionUsersRelationModel, relation)).toHaveProperty('following', null);
	expect(v.safeParse(unionUsersRelationModel, { ...relation, isMuted: 1 }).success).toBe(false);
	const { isFollowing, ...missing } = relation;
	expect(isFollowing).toBe(false);
	expect(v.safeParse(unionUsersRelationModel, missing).success).toBe(false);
});
