/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mockDeep } from 'vitest-mock-extended';
import { MiAnnouncement } from '@features/announcements/backend/models/Announcement.js';
import { MiUserSecurityKey } from '@features/auth/backend/models/UserSecurityKey.js';
import { type RoleService, DEFAULT_POLICIES } from '@features/roles/backend/services/RoleService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import type { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { ChatService } from '@features/chat/backend/services/ChatService.js';
import { UserEntityService } from '../../backend/serializers/UserEntityService.js';
import { MiUser } from '../../backend/models/User.js';
import { MiUserProfile } from '../../backend/models/UserProfile.js';
export const timestamp = new Date('2026-01-01T00:00:00Z');
export const announcement = new MiAnnouncement({ id: 'notice123', updatedAt: timestamp, text: 'notice', title: 'notice', imageUrl: null, icon: 'info', display: 'dialog', needConfirmationToRead: true, isActive: true, forExistingUsers: false, silence: false, userId: null });
export const selectedKey = new MiUserSecurityKey({ id: 'key123', name: 'key', lastUsed: timestamp });
export function createUserSerializationFixture() {
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
	const profile = new MiUserProfile({ userId: user.id, url: null, description: null, location: null, birthday: null, lang: null, fields: [], verifiedLinks: [], pinnedPageId: null, publicReactions: true, followersVisibility: 'private', followingVisibility: 'private', moderationNote: 'moderator-only', followedMessage: 'followers-only', twoFactorEnabled: true, usePasswordLessLogin: false, injectFeaturedNote: true, receiveAnnouncementEmail: true, alwaysMarkNsfw: false, autoSensitive: false, carefulBot: false, autoAcceptFollowed: false, followApprovalLocalSeconds: null, followApprovalRemoteSeconds: null, noCrawle: false, preventAiLearning: true, twoFactorBackupSecret: null, mutedWords: ['regex', ['one', 'two']], hardMutedWords: ['hard'], mutedInstances: [], notificationRecieveConfig: {}, emailNotificationTypes: [], achievements: [], loggedInDates: [], email: 'private@example.com', emailVerified: true });
	profiles.findOneByOrFail.mockResolvedValue(profile);
	users.findOneByOrFail.mockResolvedValue(user);
	users.findBy.mockResolvedValue([user]);
	profiles.findBy.mockResolvedValue([profile]);
	const hints = { userProfile: profile, userRelations: new Map(), userMemos: new Map(), pinNotes: new Map() };
	return { service, user, profile, hints, roles, keys, announcements, ids, users };
}
