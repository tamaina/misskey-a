/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { iMoveContract } from '../../backend/endpoints/i/move.contract.js';
import { adminAccountsFindByEmailContract } from '../../backend/endpoints/admin/accounts/find-by-email.contract.js';
import { iContract } from '../../backend/endpoints/i.contract.js';
import { usersContract } from '../../backend/endpoints/users.contract.js';
import { adminAccountsDeleteContract } from '../../backend/endpoints/admin/accounts/delete.contract.js';
import { adminDeleteAccountContract } from '../../backend/endpoints/admin/delete-account.contract.js';
import { iDeleteAccountContract } from '../../backend/endpoints/i/delete-account.contract.js';
import { usersUpdateMemoContract } from '../../backend/endpoints/users/update-memo.contract.js';
import { packedAchievementSchema } from '../../backend/user.schema.js';
import { AchievementService } from '../../backend/services/AchievementService.js';
import { UserEntityService } from '../../backend/serializers/UserEntityService.js';
import type { MiLocalUser } from '../../backend/models/User.js';
import type { MiUserProfile } from '../../backend/models/UserProfile.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import type { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { ChatService } from '@features/chat/backend/services/ChatService.js';

const defaults = { limit: 10, offset: 0, state: 'all', origin: 'local', hostname: null };

test.each([
	{ name: 'i/move', schema: requiredSchema(iMoveContract['~orpc'].inputSchema), input: { moveToAccount: 'alice@example.com' }, expected: { moveToAccount: 'alice@example.com' } },
	{ name: 'admin/accounts/find-by-email', schema: requiredSchema(adminAccountsFindByEmailContract['~orpc'].inputSchema), input: { email: 'alice@example.com' }, expected: { email: 'alice@example.com' } },
	{ name: 'i', schema: requiredSchema(iContract['~orpc'].inputSchema), input: {}, expected: {} },
	{ name: 'users', schema: requiredSchema(usersContract['~orpc'].inputSchema), input: {}, expected: defaults },
	{ name: 'admin/accounts/delete', schema: requiredSchema(adminAccountsDeleteContract['~orpc'].inputSchema), input: { userId: 'user123' }, expected: { userId: 'user123' } },
	{ name: 'admin/delete-account', schema: requiredSchema(adminDeleteAccountContract['~orpc'].inputSchema), input: { userId: 'user123' }, expected: { userId: 'user123' } },
	{ name: 'i/delete-account', schema: requiredSchema(iDeleteAccountContract['~orpc'].inputSchema), input: { password: 'password' }, expected: { password: 'password' } },
	{ name: 'users/update-memo', schema: requiredSchema(usersUpdateMemoContract['~orpc'].inputSchema), input: { userId: 'user123', memo: null }, expected: { userId: 'user123', memo: null } },
])('$name native input strips extra keys', ({ schema, input, expected }) => {
	expect(v.parse(schema, { ...input, future: { extension: true } })).toEqual(expected);
});

test('empty i retains native array acceptance and rejects non-objects', () => {
	expect(v.parse(requiredSchema(iContract['~orpc'].inputSchema), {})).toEqual({});
	for (const input of [[], ['extension'], null, undefined, 'value', 1, true]) expect(v.safeParse(requiredSchema(iContract['~orpc'].inputSchema), input).success).toBe(false);
});

test('users retains every default, nullable hostname, enum and integer bound', () => {
	expect(v.parse(requiredSchema(usersContract['~orpc'].inputSchema), { limit: undefined, offset: undefined, state: undefined, origin: undefined, hostname: undefined })).toEqual(defaults);
	for (const sort of ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt']) {
		expect(v.parse(requiredSchema(usersContract['~orpc'].inputSchema), { sort })).toEqual({ ...defaults, sort });
	}
	for (const state of ['all', 'alive']) for (const origin of ['combined', 'local', 'remote']) {
		const input = { limit: 100, offset: -1, state, origin, hostname: 'example.com' };
		expect(v.parse(requiredSchema(usersContract['~orpc'].inputSchema), input)).toEqual(input);
	}
	for (const input of [{ limit: 0 }, { limit: 101 }, { limit: 1.5 }, { limit: '10' }, { offset: 0.5 }, { offset: '0' }, { sort: 'invalid' }, { sort: null }, { sort: undefined }, { state: null }, { state: 'invalid' }, { origin: 'invalid' }, { hostname: 1 }]) {
		expect(v.safeParse(requiredSchema(usersContract['~orpc'].inputSchema), input).success).toBe(false);
	}
});

test('required strings, Misskey IDs and nullable memo/token retain their validators', () => {
	for (const schema of [requiredSchema(iMoveContract['~orpc'].inputSchema), requiredSchema(adminAccountsFindByEmailContract['~orpc'].inputSchema), requiredSchema(adminAccountsDeleteContract['~orpc'].inputSchema), requiredSchema(adminDeleteAccountContract['~orpc'].inputSchema), requiredSchema(iDeleteAccountContract['~orpc'].inputSchema), requiredSchema(usersUpdateMemoContract['~orpc'].inputSchema)]) {
		expect(v.safeParse(schema, {}).success).toBe(false);
	}
	for (const schema of [requiredSchema(adminAccountsDeleteContract['~orpc'].inputSchema), requiredSchema(adminDeleteAccountContract['~orpc'].inputSchema)]) {
		for (const userId of ['', 'user-123', 1, null]) expect(v.safeParse(schema, { userId }).success).toBe(false);
	}
	for (const memo of [null, '', 'memo']) expect(v.parse(requiredSchema(usersUpdateMemoContract['~orpc'].inputSchema), { userId: 'user123', memo })).toEqual({ userId: 'user123', memo });
	for (const input of [{ userId: 'user123' }, { userId: 'user-123', memo: '' }, { userId: 'user123', memo: 1 }]) expect(v.safeParse(requiredSchema(usersUpdateMemoContract['~orpc'].inputSchema), input).success).toBe(false);
	for (const token of [null, '', 'token']) expect(v.parse(requiredSchema(iDeleteAccountContract['~orpc'].inputSchema), { password: '', token })).toEqual({ password: '', token });
	for (const input of [{ password: 1 }, { password: '', token: 1 }, { password: '', token: undefined }]) expect(v.safeParse(requiredSchema(iDeleteAccountContract['~orpc'].inputSchema), input).success).toBe(false);
	for (const input of [{ moveToAccount: 1 }, { moveToAccount: null }]) expect(v.safeParse(requiredSchema(iMoveContract['~orpc'].inputSchema), input).success).toBe(false);
	for (const email of [1, null]) expect(v.safeParse(requiredSchema(adminAccountsFindByEmailContract['~orpc'].inputSchema), { email }).success).toBe(false);
});

test('actual achievement writer and self serializer emit the closed achievement model', async () => {
	const profiles = mockDeep<ConstructorParameters<typeof AchievementService>[0]>();
	const notifications = mockDeep<ConstructorParameters<typeof AchievementService>[1]>();
	const previous = { name: 'notes1', unlockedAt: 1 } satisfies v.InferOutput<typeof packedAchievementSchema>;
	const profile = mockDeep<MiUserProfile>({ achievements: [previous], loggedInDates: [], fields: [], verifiedLinks: [], pinnedPageId: null, twoFactorEnabled: false });
	profiles.findOneByOrFail.mockResolvedValue(profile);
	const achievements = new AchievementService(profiles, notifications);
	await achievements.create('user123', 'notes10');
	const stored = profiles.update.mock.calls[0][1].achievements;
	expect(stored).toEqual([previous, { name: 'notes10', unlockedAt: expect.any(Number) }]);
	profile.achievements = v.parse(v.array(packedAchievementSchema), stored);
	expect(notifications.createNotification).toHaveBeenCalledWith('user123', 'achievementEarned', { achievement: 'notes10' });

	const moduleRef = mockDeep<ConstructorParameters<typeof UserEntityService>[0]>();
	const notes = mockDeep<NoteEntityService>();
	const emojis = mockDeep<CustomEmojiService>();
	const announcements = mockDeep<AnnouncementService>();
	const roles = mockDeep<RoleService>();
	const ids = mockDeep<IdService>();
	const chat = mockDeep<ChatService>();
	notes.packMany.mockResolvedValue([]);
	emojis.populateEmojis.mockResolvedValue({});
	announcements.getUnreadAnnouncements.mockResolvedValue([]);
	roles.isModerator.mockResolvedValue(false);
	roles.isAdministrator.mockResolvedValue(false);
	roles.getUserBadgeRoles.mockResolvedValue([]);
	roles.getUserRoles.mockResolvedValue([]);
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<RoleService['getUserPolicies']>>>({ canPublicNote: true, chatAvailability: 'available' }));
	ids.parse.mockReturnValue({ date: new Date('2026-01-01T00:00:00Z') });
	chat.hasUnreadMessages.mockResolvedValue(false);
	moduleRef.get.mockReturnValueOnce(mockDeep()).mockReturnValueOnce(notes).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(emojis).mockReturnValueOnce(announcements).mockReturnValueOnce(roles).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(ids).mockReturnValueOnce(mockDeep()).mockReturnValueOnce(chat);
	const service = new UserEntityService(moduleRef, mockDeep<ConstructorParameters<typeof UserEntityService>[1]>({ url: 'https://example.com', host: 'example.com' }), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), profiles, mockDeep());
	service.onModuleInit();
	const user = mockDeep<MiLocalUser>({ id: 'user123', username: 'alice', host: null, avatarId: null, bannerId: null, avatarDecorations: [], emojis: [], movedToUri: null, alsoKnownAs: null, updatedAt: null, lastFetchedAt: null });
	const output = await service.packSelf(user, { userProfile: profile, userMemos: new Map(), pinNotes: new Map() });
	expect(output.achievements).toBe(profile.achievements);
	for (const value of output.achievements) {
		expect(v.parse(packedAchievementSchema, value)).toEqual(value);
		expect(v.safeParse(packedAchievementSchema, { ...value, future: true }).success).toBe(false);
		expect(v.safeParse(packedAchievementSchema, { name: value.name }).success).toBe(false);
		expect(v.safeParse(packedAchievementSchema, { unlockedAt: value.unlockedAt }).success).toBe(false);
		expect(v.safeParse(packedAchievementSchema, { ...value, name: 'unknown' }).success).toBe(false);
		expect(v.safeParse(packedAchievementSchema, { ...value, unlockedAt: '1' }).success).toBe(false);
	}
	await achievements.create(user.id, 'notes10');
	expect(profiles.update).toHaveBeenCalledTimes(1);
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
