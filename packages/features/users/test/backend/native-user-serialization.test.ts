/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { createUserSerializationFixture as fixture, timestamp, announcement, selectedKey } from './user-serialization-fixture.js';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { FollowingEntityService, nativeFollowingSchema } from '@features/relationships/backend/serializers/FollowingEntityService.js';
import { MiFollowing } from '@features/relationships/backend/models/Following.js';
import { packedFollowingSchema } from '@features/relationships/backend/endpoints/relationships.schema.js';
import { type UserRelation } from '../../backend/serializers/UserEntityService.js';
import { nativeMeDetailedSchema, nativeUserDetailedSchema } from '../../backend/serializers/native-user.js';
import { packedMeDetailedSchema, packedUserDetailedNotMeSchema, packedUserDetailedSchema, packedUserLiteSchema } from '../../backend/user.schema.js';
test('partial entity selection retains own undefined columns, which existing JSON transport omits', () => {
	expect(Object.keys(announcement)).toContain('user');
	expect(announcement.user).toBeUndefined();
	expect(Object.keys(selectedKey)).toEqual(['id', 'userId', 'user', 'name', 'publicKey', 'counter', 'lastUsed', 'credentialDeviceType', 'credentialBackedUp', 'transports']);
	expect(JSON.parse(JSON.stringify(selectedKey))).toEqual({ id: 'key123', name: 'key', lastUsed: timestamp.toISOString() });
});

test('actual self serialization validates full native and wire Me variants without inventing fields', async () => {
	const f = fixture();
	const native = await f.service.packSelf(f.user.id, { ...f.hints, includeSecrets: true });
	expect(v.parse(nativeMeDetailedSchema, native)).toEqual(native);
	expect(native.securityKeysList?.[0].lastUsed).toBe(timestamp);
	expect(native.unreadAnnouncements[0].updatedAt).toBe(timestamp);
	expect(native.unreadAnnouncements[0]).not.toHaveProperty('forYou');
	expect(native.mutedWords).toEqual(['regex', ['one', 'two']]);
	expect(native.followersCount).toBe(3);
	expect(native.followingCount).toBe(4);
	expect(f.keys.find).toHaveBeenCalledWith({ where: { userId: f.user.id }, select: { id: true, name: true, lastUsed: true } });
	const wire = JSON.parse(JSON.stringify(native));
	expect(v.parse(packedMeDetailedSchema, wire)).toEqual(wire);
	expect(v.parse(packedUserDetailedSchema, wire)).toEqual(wire);
	expect(v.safeParse(packedUserDetailedNotMeSchema, wire).success).toBe(false);
	for (const schema of [nativeMeDetailedSchema, nativeUserDetailedSchema]) {
		expect(v.safeParse(schema, { ...native, future: true }).success).toBe(false);
	}
	expect(v.safeParse(nativeMeDetailedSchema, { ...native, securityKeysList: [{ ...selectedKey, lastUsed: null }] }).success).toBe(false);
	expect(v.safeParse(packedMeDetailedSchema, { ...wire, securityKeysList: [{ ...wire.securityKeysList[0], lastUsed: null }] }).success).toBe(false);
});

test.each(['other', 'anonymous'] as const)('actual %s view stays NotMe and contains no self secrets', async viewer => {
	const f = fixture();
	const native = await f.service.pack(f.user, viewer === 'anonymous' ? null : { id: 'other123' }, { schema: 'UserDetailedNotMe', ...f.hints });
	expect(v.parse(packedUserDetailedNotMeSchema, native)).toEqual(native);
	expect(v.parse(packedUserDetailedSchema, JSON.parse(JSON.stringify(native)))).toEqual(JSON.parse(JSON.stringify(native)));
	for (const key of ['email', 'emailVerified', 'securityKeysList', 'unreadAnnouncements', 'policies', 'avatarId', 'isAdmin']) expect(native).not.toHaveProperty(key);
	expect(native.followersCount).toBe(0);
	expect(native.followingCount).toBe(0);
	expect(native.moderationNote).toBeUndefined();
	expect(native.twoFactorEnabled).toBeUndefined();
	expect(f.announcements.getUnreadAnnouncements).not.toHaveBeenCalled();
	expect(f.keys.find).not.toHaveBeenCalled();
});

test('detailed schema selection does not control identity; Lite remains precise even for self', async () => {
	const f = fixture();
	const native = await f.service.pack(f.user, f.user, { schema: 'UserDetailedNotMe', ...f.hints });
	expect(v.parse(nativeMeDetailedSchema, native)).toEqual(native);
	expect(native).not.toHaveProperty('email');
	expect(v.safeParse(packedUserDetailedNotMeSchema, JSON.parse(JSON.stringify(native))).success).toBe(false);
	const lite = await f.service.pack(f.user, f.user);
	expect(v.parse(packedUserLiteSchema, lite)).toEqual(lite);
	expect(lite).not.toHaveProperty('unreadAnnouncements');
	expect(v.safeParse(packedUserLiteSchema, { ...lite, future: true }).success).toBe(false);
});

test('Following serializes self in either populated slot and validates its explicit detailed union', async () => {
	for (const slot of ['followee', 'follower'] as const) {
		const f = fixture();
		const following = Object.assign(new MiFollowing(), { id: 'following123', followeeId: slot === 'followee' ? f.user.id : 'other123', followerId: slot === 'follower' ? f.user.id : 'other123', followee: slot === 'followee' ? f.user : null, follower: slot === 'follower' ? f.user : null });
		const service = new FollowingEntityService(mockDeep(), f.service, f.ids);
		const native = await service.pack(following, f.user, { populateFollowee: slot === 'followee', populateFollower: slot === 'follower' });
		expect(v.parse(nativeFollowingSchema, native)).toEqual(native);
		const wire = JSON.parse(JSON.stringify(native));
		expect(v.parse(packedFollowingSchema, wire)).toEqual(wire);
		expect(wire[slot].unreadAnnouncements).toHaveLength(1);
		expect(wire[slot]).not.toHaveProperty('email');
		expect(v.safeParse(packedFollowingSchema, { ...wire, future: true }).success).toBe(false);
	}
});

test('moderator other view retains security flags and moderation note but excludes Me data', async () => {
	const f = fixture();
	f.roles.isModerator.mockResolvedValue(true);
	const output = await f.service.pack(f.user, { id: 'moderator123' }, { schema: 'UserDetailed', ...f.hints });
	expect(v.parse(packedUserDetailedNotMeSchema, output)).toEqual(output);
	expect(output.moderationNote).toBe('moderator-only');
	expect(output.twoFactorEnabled).toBe(true);
	expect(output.securityKeys).toBe(true);
	expect(output.followersCount).toBe(3);
	for (const key of ['email', 'securityKeysList', 'policies', 'unreadAnnouncements', 'avatarId', 'isAdmin']) expect(output).not.toHaveProperty(key);
	expect(f.announcements.getUnreadAnnouncements).not.toHaveBeenCalled();
	expect(f.keys.find).not.toHaveBeenCalled();
});

test('other followers retain visibility and followed-message boundaries without self fields', async () => {
	for (const isFollowing of [false, true]) {
		const f = fixture();
		f.profile.followersVisibility = 'followers';
		f.profile.followingVisibility = 'followers';
		const relation: UserRelation = { id: f.user.id, following: null, isFollowing, isFollowed: false, hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false, isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false };
		const output = await f.service.pack(f.user, { id: 'other123' }, { schema: 'UserDetailed', ...f.hints, userRelations: new Map([[f.user.id, relation]]) });
		expect(v.parse(packedUserDetailedNotMeSchema, output)).toEqual(output);
		expect(output.followersCount).toBe(isFollowing ? 3 : 0);
		expect(output.followingCount).toBe(isFollowing ? 4 : 0);
		expect(output.followedMessage).toBe(isFollowing ? 'followers-only' : undefined);
		expect(output.moderationNote).toBeUndefined();
		for (const key of ['email', 'securityKeysList', 'unreadAnnouncements', 'policies']) expect(output).not.toHaveProperty(key);
	}
});
