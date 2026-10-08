/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { MiAnnouncement } from '@features/announcements/backend/models/Announcement.js';
import { MiUserSecurityKey } from '@features/auth/backend/models/UserSecurityKey.js';
import { RoleService, DEFAULT_POLICIES } from '@features/roles/backend/services/RoleService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import type { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { ChatService } from '@features/chat/backend/services/ChatService.js';
import { FollowingEntityService, nativeFollowingSchema } from '@features/relationships/backend/serializers/FollowingEntityService.js';
import { MiFollowing } from '@features/relationships/backend/models/Following.js';
import { packedFollowingSchema } from '@features/relationships/contract/packed.js';
import { UserEntityService, type UserRelation } from '../../backend/serializers/UserEntityService.js';
import { nativeMeDetailedSchema, nativeUserDetailedSchema } from '../../backend/serializers/native-user.js';
import { MiUser } from '../../backend/models/User.js';
import { MiUserProfile } from '../../backend/models/UserProfile.js';
import { packedMeDetailedSchema, packedUserDetailedNotMeSchema, packedUserDetailedSchema, packedUserLiteSchema } from '../../contract/packed.js';

const timestamp = new Date('2026-01-01T00:00:00Z');
const announcement = new MiAnnouncement({ id: 'notice123', updatedAt: timestamp, text: 'notice', title: 'notice', imageUrl: null, icon: 'info', display: 'dialog', needConfirmationToRead: true, isActive: true, forExistingUsers: false, silence: false, userId: null });
const selectedKey = new MiUserSecurityKey({ id: 'key123', name: 'key', lastUsed: timestamp });

function fixture() {
	const moduleRef = mockDeep<ConstructorParameters<typeof UserEntityService>[0]>();
	const notes = mockDeep<NoteEntityService>();
	const emojis = mockDeep<CustomEmojiService>();
	const announcements = mockDeep<AnnouncementService>();
	const roles = mockDeep<RoleService>();
	const ids = mockDeep<IdService>();
	const chat = mockDeep<ChatService>();
	const profiles = mockDeep<ConstructorParameters<typeof UserEntityService>[12]>();
	const redis = mockDeep<ConstructorParameters<typeof UserEntityService>[3]>();
	const keys = mockDeep<ConstructorParameters<typeof UserEntityService>[5]>();
	const requests = mockDeep<ConstructorParameters<typeof UserEntityService>[7]>();
	const users = mockDeep<ConstructorParameters<typeof UserEntityService>[4]>();
	const memos = mockDeep<ConstructorParameters<typeof UserEntityService>[13]>();
	memos.findOneBy.mockResolvedValue(null);
	const pins = mockDeep<ConstructorParameters<typeof UserEntityService>[11]>();
	const pinQuery = mockDeep<ReturnType<typeof pins.createQueryBuilder>>();
	pinQuery.where.mockReturnThis();
	pinQuery.innerJoinAndSelect.mockReturnThis();
	pinQuery.orderBy.mockReturnThis();
	pinQuery.getMany.mockResolvedValue([]);
	pins.createQueryBuilder.mockReturnValue(pinQuery);
	notes.packMany.mockResolvedValue([]);
	emojis.populateEmojis.mockResolvedValue({});
	announcements.getUnreadAnnouncements.mockResolvedValue([announcement]);
	roles.isModerator.mockResolvedValue(false);
	roles.isAdministrator.mockResolvedValue(false);
	roles.getUserBadgeRoles.mockResolvedValue([]);
	roles.getUserRoles.mockResolvedValue([]);
	roles.getUserPolicies.mockResolvedValue(DEFAULT_POLICIES);
	ids.parse.mockReturnValue({ date: timestamp });
	chat.hasUnreadMessages.mockResolvedValue(false);
	redis.get.mockResolvedValue(null);
	redis.xlen.mockResolvedValue(2);
	requests.countBy.mockResolvedValue(0);
	keys.countBy.mockResolvedValue(1);
	keys.find.mockResolvedValue([selectedKey]);
	moduleRef.get.mockReturnValueOnce(mockDeep()).mockReturnValueOnce(notes).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(emojis).mockReturnValueOnce(announcements).mockReturnValueOnce(roles).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(ids).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(chat);
	const service = new UserEntityService(moduleRef, mockDeep<ConstructorParameters<typeof UserEntityService>[1]>({ url: 'https://example.com', host: 'example.com' }), mockDeep(), redis, users, keys, mockDeep(), requests, mockDeep(), mockDeep(), mockDeep(), pins, profiles, memos);
	service.onModuleInit();
	const user = new MiUser({ id: 'user123', name: 'Alice', username: 'alice', host: null, uri: null, avatarId: null, bannerId: null, avatarDecorations: [], emojis: [], movedToUri: null, alsoKnownAs: null, updatedAt: null, lastFetchedAt: null, isBot: false, isCat: false, requireSigninToViewContents: false, isLocked: false, isSuspended: false, followersCount: 3, followingCount: 4, notesCount: 5, chatScope: 'following', isExplorable: true, isDeleted: false, hideOnlineStatus: false, lastActiveDate: null });
	const profile = new MiUserProfile({ userId: user.id, url: null, description: null, location: null, birthday: null, lang: null, fields: [], verifiedLinks: [], pinnedPageId: null, publicReactions: true, followersVisibility: 'private', followingVisibility: 'private', moderationNote: 'moderator-only', followedMessage: 'followers-only', twoFactorEnabled: true, usePasswordLessLogin: false, injectFeaturedNote: true, receiveAnnouncementEmail: true, alwaysMarkNsfw: false, autoSensitive: false, carefulBot: false, autoAcceptFollowed: false, noCrawle: false, preventAiLearning: true, twoFactorBackupSecret: null, mutedWords: ['regex', ['one', 'two']], hardMutedWords: ['hard'], mutedInstances: [], notificationRecieveConfig: {}, emailNotificationTypes: [], achievements: [], loggedInDates: [], email: 'private@example.com', emailVerified: true });
	profiles.findOneByOrFail.mockResolvedValue(profile);
	users.findOneByOrFail.mockResolvedValue(user);
	users.findBy.mockResolvedValue([user]);
	profiles.findBy.mockResolvedValue([profile]);
	const hints = { userProfile: profile, userRelations: new Map(), userMemos: new Map(), pinNotes: new Map() };
	return { service, user, profile, hints, roles, keys, announcements, ids, users };
}

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
