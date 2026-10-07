/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { SelectQueryBuilder } from 'typeorm';
import type { MiAbuseReportNotificationRecipient, MiAbuseUserReport, MiAntenna, MiApp, MiAuthSession, MiBlocking, MiChannel, MiChatMessage, MiDriveFile, MiDriveFolder, MiEmoji, MiFollowing, MiFollowRequest, MiHashtag, MiInstance, MiMeta, MiModerationLog, MiMuting, MiRegistrationTicket, MiRenoteMuting, MiReversiGame, MiRole, MiSignin, MiSystemWebhook, MiUser, MiUserList, MiUserListMembership } from '@/models/_.js';
import type { Packed } from '../../../features/index/contract/packed.js';
import type { MiLocalUser } from '../../../features/users/backend/models/User.js';
import { createAuthServices, type AuthServicesDependencies } from '../../../features/auth/backend/services.js';
import { createChannelServices, type ChannelServicesDependencies } from '../../../features/channels/backend/services.js';
import { createChatServices, type ChatServicesDependencies } from '../../../features/chat/backend/services.js';
import { createDiscoveryServices } from '../../../features/discovery/backend/services.js';
import { createDriveServices, type DriveServicesDependencies } from '../../../features/drive/backend/services.js';
import { createEmojiServices, type EmojiServicesDependencies } from '../../../features/emojis/backend/services.js';
import { createGameServices, type GameServicesDependencies } from '../../../features/games/backend/services.js';
import { createInstanceServices, type InstanceServicesDependencies } from '../../../features/instance/backend/services.js';
import { createIntegrationServices, type IntegrationServicesDependencies } from '../../../features/integrations/backend/services.js';
import { createModerationServices, type ModerationServicesDependencies } from '../../../features/moderation/backend/services.js';
import { createRelationshipServices, type RelationshipServicesDependencies } from '../../../features/relationships/backend/services.js';
import { createRoleServices, type RoleServicesDependencies } from '../../../features/roles/backend/services.js';
import { createTimelineServices, type TimelineServicesDependencies } from '../../../features/timelines/backend/services.js';

function fixture<Model>(fields: Partial<Model>): Model {
	return fields as Model;
}

const date = new Date('2026-01-02T03:04:05.000Z');
const viewer = { id: 'viewer' };
const user = fixture<Packed<'UserLite'>>({ id: 'user' });
const detailedUser = fixture<Packed<'UserDetailedNotMe'>>({ id: 'user' });

describe('annotation-free feature serializers', () => {
	test('auth sessions reuse their composed app serializer and preserve secret visibility', async () => {
		const deps = mockDeep<AuthServicesDependencies>();
		const app = fixture<MiApp>({ id: 'app', secret: 'secret', permission: [] });
		deps.appsRepository.findOneByOrFail.mockResolvedValue(app);
		deps.accessTokensRepository.countBy.mockResolvedValue(1);
		const services = createAuthServices(deps);
		const packApp = vi.spyOn(services.AppEntityService, 'pack');
		const pack = services.AuthSessionEntityService.pack;
		const packed = await pack(fixture<MiAuthSession>({ id: 'session', appId: 'app', token: 'token' }), viewer);
		expect(packApp).toHaveBeenCalledWith('app', viewer);
		expect(packed.app).toMatchObject({ id: 'app', isAuthorized: true });
		expect(packed.app).not.toHaveProperty('secret');
		expect(await services.AppEntityService.pack(app, null, { includeSecret: true })).toHaveProperty('secret', 'secret');
		expect(deps.accessTokensRepository.countBy).toHaveBeenCalledWith({ appId: 'app', userId: 'viewer' });
	});

	test('invite codes keep dates and batch user hints without repacking', async () => {
		const deps = mockDeep<AuthServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.packMany.mockResolvedValue([user]);
		const ticket = fixture<MiRegistrationTicket>({ id: 'ticket', code: 'code', expiresAt: date, usedAt: null, createdById: 'user', createdBy: fixture<MiUser>({ id: 'user' }), usedById: null, usedBy: null });
		const packMany = createAuthServices(deps).InviteCodeEntityService.packMany;
		expect(await packMany([ticket], viewer)).toEqual([expect.objectContaining({ id: 'ticket', code: 'code', createdAt: date.toISOString(), expiresAt: date.toISOString(), createdBy: user, usedBy: null, used: false })]);
		expect(deps.userEntityService.packMany).toHaveBeenCalledWith([ticket.createdBy], viewer);
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('signin serialization retains bound date parsing and audit fields', async () => {
		const deps = mockDeep<AuthServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		const pack = createAuthServices(deps).SigninEntityService.pack;
		expect(await pack(fixture<MiSignin>({ id: 'signin', ip: '127.0.0.1', headers: { accept: 'application/json' }, success: false }))).toEqual({ id: 'signin', createdAt: date.toISOString(), ip: '127.0.0.1', headers: { accept: 'application/json' }, success: false });
	});

	test('channels preserve viewer hints, banner URLs, and pinned-note order', async () => {
		const deps = mockDeep<ChannelServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.driveFileEntityService.getPublicUrl.mockReturnValue('https://example.com/banner');
		deps.noteEntityService.packMany.mockResolvedValue([fixture<Packed<'Note'>>({ id: 'second' }), fixture<Packed<'Note'>>({ id: 'first' })]);
		const channel = fixture<MiChannel>({ id: 'channel', bannerId: 'banner', lastNotedAt: null, pinnedNoteIds: ['first', 'second'] });
		const banner = fixture<MiDriveFile>({ id: 'banner' });
		const pack = createChannelServices(deps).ChannelEntityService.pack;
		const packed = await pack(channel, viewer, true, { bannerFiles: new Map([['banner', banner]]), followings: new Set(['channel']), favorites: new Set(), muting: new Set(), pinnedNotes: new Map() });
		expect(packed).toMatchObject({ isFollowing: true, isFavorited: false, isMuting: false, bannerUrl: 'https://example.com/banner' });
		expect(packed.pinnedNotes?.map(note => note.id)).toEqual(['first', 'second']);
		expect(deps.driveFilesRepository.findOneByOrFail).not.toHaveBeenCalled();
		expect(deps.channelFollowingsRepository.exists).not.toHaveBeenCalled();
	});

	test('chat drops deleted reaction authors and preserves sender and file hints', async () => {
		const deps = mockDeep<ChatServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.pack.mockRejectedValue(new Error('deleted'));
		const file = fixture<Packed<'DriveFile'>>({ id: 'file' });
		const message = fixture<MiChatMessage>({ id: 'message', fromUserId: 'user', toUserId: null, toRoomId: null, fileId: 'file', reactions: ['deleted/like', 'user/wave'] });
		const pack = createChatServices(deps).ChatEntityService.packMessageDetailed;
		const packed = await pack(message, viewer, { _hint_: { packedUsers: new Map([['user', user]]), packedFiles: new Map([['file', file]]) } });
		expect(packed).toMatchObject({ createdAt: date.toISOString(), fromUser: user, file, reactions: [{ user, reaction: 'wave' }] });
		expect(deps.userEntityService.pack).toHaveBeenCalledOnce();
		expect(deps.driveFileEntityService.pack).not.toHaveBeenCalled();
	});

	test('discovery composes a dependency-free bound hashtag serializer', async () => {
		const packMany = createDiscoveryServices().HashtagEntityService.packMany;
		const hashtag = fixture<MiHashtag>({ name: 'misskey', mentionedUsersCount: 3, attachedLocalUsersCount: 2 });
		expect(await packMany([hashtag])).toEqual([expect.objectContaining({ tag: 'misskey', mentionedUsersCount: 3, attachedLocalUsersCount: 2 })]);
	});

	test('drive folders retain recursive detail packing and count hints', async () => {
		const deps = mockDeep<DriveServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		const parent = fixture<MiDriveFolder>({ id: 'parent', parentId: null });
		const child = fixture<MiDriveFolder>({ id: 'child', parentId: 'parent' });
		const pack = createDriveServices(deps).DriveFolderEntityService.pack;
		const packed = await pack(child, { detail: true }, { folderMap: new Map([['parent', parent]]), foldersCountMap: new Map([['child', 1], ['parent', 2]]), filesCountMap: new Map([['child', 4], ['parent', 0]]) });
		expect(packed).toMatchObject({ id: 'child', foldersCount: 1, filesCount: 4, parent: { id: 'parent', foldersCount: 2, filesCount: 0 } });
		expect(deps.driveFoldersRepository.findOneByOrFail).not.toHaveBeenCalled();
		expect(deps.driveFoldersRepository.countBy).not.toHaveBeenCalled();
		expect(deps.driveFilesRepository.countBy).not.toHaveBeenCalled();
	});

	test('emoji serialization preserves URL fallback and role display ordering', async () => {
		const deps = mockDeep<EmojiServicesDependencies>();
		const emoji = fixture<MiEmoji>({ id: 'emoji', publicUrl: '', originalUrl: 'https://example.com/emoji', roleIdsThatCanBeUsedThisEmojiAsReaction: ['a', 'b'], updatedAt: date });
		const services = createEmojiServices(deps);
		const packSimple = services.EmojiEntityService.packSimple;
		expect(await packSimple(emoji)).toHaveProperty('url', 'https://example.com/emoji');
		const roles = new Map([['a', fixture<MiRole>({ id: 'a', name: 'A', displayOrder: 1 })], ['b', fixture<MiRole>({ id: 'b', name: 'B', displayOrder: 2 })]]);
		const packed = await services.EmojiEntityService.packDetailedAdmin(emoji, { roles });
		expect(packed.roleIdsThatCanBeUsedThisEmojiAsReaction).toEqual([{ id: 'b', name: 'B' }, { id: 'a', name: 'A' }]);
		expect(deps.rolesRepository.findBy).not.toHaveBeenCalled();
	});

	test('reversi serialization keeps invalid-rule fallback, winner hints, and dates', async () => {
		const deps = mockDeep<GameServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		const other = fixture<Packed<'UserLite'>>({ id: 'other' });
		const game = fixture<MiReversiGame>({ id: 'game', user1Id: 'user', user2Id: 'other', winnerId: 'other', bw: 'invalid', startedAt: null, endedAt: date });
		const pack = createGameServices(deps).ReversiGameEntityService.packDetail;
		expect(await pack(game, { packedUser1: user, packedUser2: other })).toMatchObject({ bw: 'random', winner: other, createdAt: date.toISOString(), endedAt: date.toISOString() });
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('instance moderation notes stay private and software suspension is preserved', async () => {
		const deps = mockDeep<InstanceServicesDependencies>();
		deps.utilityService.isDeliverSuspendedSoftware.mockReturnValue({ software: 'example', versionRange: '*' });
		deps.roleService.isModerator.mockResolvedValue(false);
		const instance = fixture<MiInstance>({ id: 'instance', host: 'example.com', firstRetrievedAt: date, infoUpdatedAt: null, latestRequestReceivedAt: null, suspensionState: 'none', moderationNote: 'private' });
		const pack = createInstanceServices({ ...deps, meta: fixture<MiMeta>({ blockedHosts: [], silencedHosts: [], mediaSilencedHosts: [] }) }).InstanceEntityService.pack;
		expect(await pack(instance, viewer)).toMatchObject({ isSuspended: true, suspensionState: 'softwareSuspended', moderationNote: null });
		deps.roleService.isModerator.mockResolvedValue(true);
		expect(await pack(instance, viewer)).toHaveProperty('moderationNote', 'private');
	});

	test('meta composition preserves theme conversion and reads ads through its port', async () => {
		const deps = mockDeep<InstanceServicesDependencies>();
		const builder = mockDeep<SelectQueryBuilder<import('@/models/_.js').MiAd>>();
		builder.where.mockReturnValue(builder);
		builder.andWhere.mockReturnValue(builder);
		builder.getMany.mockResolvedValue([]);
		deps.adsRepository.createQueryBuilder.mockReturnValue(builder);
		const pack = createInstanceServices({
			...deps,
			config: fixture<InstanceServicesDependencies['config']>({ version: 'version', url: 'https://example.com' }),
			meta: fixture<MiMeta>({ defaultLightTheme: '{name: "light"}', defaultDarkTheme: 'invalid', policies: {} }),
		}).MetaEntityService.pack;
		expect(await pack()).toMatchObject({ version: 'version', uri: 'https://example.com', defaultLightTheme: '{"name":"light"}', defaultDarkTheme: null, ads: [] });
		expect(deps.systemAccountService.fetch).not.toHaveBeenCalled();
	});

	test('detailed meta delegates proxy account lookup only when requested', async () => {
		const deps = mockDeep<InstanceServicesDependencies>();
		const meta = fixture<MiMeta>({ rootUserId: null, policies: { ltlAvailable: true, gtlAvailable: false } });
		deps.systemAccountService.fetch.mockResolvedValue(fixture<MiLocalUser>({ username: 'system.proxy' }));
		const service = createInstanceServices({ ...deps, meta }).MetaEntityService;
		expect(deps.systemAccountService.fetch).not.toHaveBeenCalled();
		const pack = vi.spyOn(service, 'pack').mockResolvedValue(fixture<Packed<'MetaLite'>>({ name: 'Instance' }));
		const packDetailed = service.packDetailed;
		expect(await packDetailed()).toMatchObject({ name: 'Instance', requireSetup: true, proxyAccountName: 'system.proxy', features: { localTimeline: true, globalTimeline: false, miauth: true } });
		expect(pack).toHaveBeenCalledWith(meta);
		expect(deps.systemAccountService.fetch).toHaveBeenCalledWith('proxy');
	});

	test('integration webhooks keep empty-batch fast paths and deterministic sorting', async () => {
		const deps = mockDeep<IntegrationServicesDependencies>();
		const packMany = createIntegrationServices(deps).SystemWebhookEntityService.packMany;
		expect(await packMany([])).toEqual([]);
		const a = fixture<MiSystemWebhook>({ id: 'a', updatedAt: date, latestSentAt: null, secret: 'secret' });
		const b = fixture<MiSystemWebhook>({ id: 'b', updatedAt: date, latestSentAt: date });
		expect((await packMany([b, a])).map(webhook => webhook.id)).toEqual(['a', 'b']);
		expect(deps.systemWebhooksRepository.findBy).not.toHaveBeenCalled();
	});

	test('moderation recipients use the same integration serializer graph and batch hints', async () => {
		const integrations = mockDeep<IntegrationServicesDependencies>();
		const webhook = fixture<MiSystemWebhook>({ id: 'webhook', updatedAt: date, latestSentAt: null });
		integrations.systemWebhooksRepository.findBy.mockResolvedValue([webhook]);
		const integrationServices = createIntegrationServices(integrations);
		const deps = mockDeep<ModerationServicesDependencies>();
		deps.userEntityService.packMany.mockResolvedValue([user]);
		const packMany = createModerationServices({ ...deps, systemWebhookEntityService: integrationServices.SystemWebhookEntityService }).AbuseReportNotificationRecipientEntityService.packMany;
		const recipient = fixture<MiAbuseReportNotificationRecipient>({ id: 'recipient', updatedAt: date, userId: 'user', systemWebhookId: 'webhook' });
		const packWebhook = vi.spyOn(integrationServices.SystemWebhookEntityService, 'pack');
		expect(await packMany([recipient])).toEqual([expect.objectContaining({ user, systemWebhook: expect.objectContaining({ id: 'webhook' }) })]);
		expect(packWebhook).toHaveBeenCalledOnce();
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('abuse reports keep detailed-user batching and nullable assignees', async () => {
		const deps = mockDeep<ModerationServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.packMany.mockResolvedValue([detailedUser]);
		const report = fixture<MiAbuseUserReport>({ id: 'report', reporterId: 'user', reporter: null, targetUserId: 'user', targetUser: null, assigneeId: null, assignee: null });
		const packMany = createModerationServices(deps).AbuseUserReportEntityService.packMany;
		expect(await packMany([report])).toEqual([expect.objectContaining({ reporter: detailedUser, targetUser: detailedUser, assignee: null })]);
		expect(deps.userEntityService.packMany).toHaveBeenCalledWith(['user', 'user'], null, { schema: 'UserDetailedNotMe' });
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('moderation logs retain date parsing, log data, and user hints', async () => {
		const deps = mockDeep<ModerationServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.packMany.mockResolvedValue([detailedUser]);
		const packMany = createModerationServices(deps).ModerationLogEntityService.packMany;
		const log = fixture<MiModerationLog>({ id: 'log', userId: 'user', user: null, type: 'deleteNote', info: { noteId: 'note' } });
		expect(await packMany([log])).toEqual([expect.objectContaining({ createdAt: date.toISOString(), type: 'deleteNote', info: { noteId: 'note' }, user: detailedUser })]);
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test.each([
		['BlockingEntityService', 'blockingsRepository', 'blockee'] as const,
		['MutingEntityService', 'mutingsRepository', 'mutee'] as const,
		['RenoteMutingEntityService', 'renoteMutingsRepository', 'mutee'] as const,
	])('%s preserves repository binding, detailed-user schema, and dates', async (serviceName, repositoryName, userKey) => {
		const deps = mockDeep<RelationshipServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.pack.mockResolvedValue(detailedUser);
		const record = fixture<MiBlocking & MiMuting & MiRenoteMuting>({ id: 'relationship', blockeeId: 'user', muteeId: 'user', expiresAt: null });
		deps[repositoryName].findOneByOrFail.mockResolvedValue(record);
		const pack = createRelationshipServices(deps)[serviceName].pack;
		expect(await pack('relationship', viewer)).toMatchObject({ id: 'relationship', createdAt: date.toISOString(), [userKey]: detailedUser });
		expect(deps[repositoryName].findOneByOrFail).toHaveBeenCalledWith({ id: 'relationship' });
		expect(deps.userEntityService.pack).toHaveBeenCalledWith('user', viewer, { schema: 'UserDetailedNotMe' });
	});

	test('following serializers keep optional population and bound locality predicates', async () => {
		const deps = mockDeep<RelationshipServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.packMany.mockResolvedValue([detailedUser]);
		const service = createRelationshipServices(deps).FollowingEntityService;
		const following = fixture<MiFollowing>({ id: 'following', followeeId: 'user', followerId: 'user', followee: null, follower: null, followerHost: null, followeeHost: 'remote.example.com' });
		const packMany = service.packMany;
		expect(await packMany([following], viewer, { populateFollower: true })).toEqual([expect.objectContaining({ follower: detailedUser, followee: undefined })]);
		const isLocalFollower = service.isLocalFollower;
		expect(isLocalFollower(following)).toBe(true);
		expect(service.isRemoteFollowee(following)).toBe(true);
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('follow requests retain one batch user lookup for both directions', async () => {
		const deps = mockDeep<RelationshipServicesDependencies>();
		deps.userEntityService.packMany.mockResolvedValue([user]);
		const request = fixture<MiFollowRequest>({ id: 'request', followerId: 'user', followeeId: 'user', follower: null, followee: null });
		const packMany = createRelationshipServices(deps).FollowRequestEntityService.packMany;
		expect(await packMany([request], viewer)).toEqual([{ id: 'request', follower: user, followee: user }]);
		expect(deps.userEntityService.packMany).toHaveBeenCalledWith(['user', 'user'], viewer);
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('user lists preserve membership IDs and batch user hints', async () => {
		const deps = mockDeep<RelationshipServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.packMany.mockResolvedValue([user]);
		const membership = fixture<MiUserListMembership>({ id: 'membership', userId: 'user', user: null, withReplies: false });
		deps.userListMembershipsRepository.findBy.mockResolvedValue([membership]);
		const service = createRelationshipServices(deps).UserListEntityService;
		const pack = service.pack;
		expect(await pack(fixture<MiUserList>({ id: 'list', name: 'List', isPublic: true }))).toEqual({ id: 'list', createdAt: date.toISOString(), name: 'List', isPublic: true, userIds: ['user'] });
		expect(await service.packMembershipsMany([membership])).toEqual([{ id: 'membership', createdAt: date.toISOString(), userId: 'user', user, withReplies: false }]);
		expect(deps.userEntityService.pack).not.toHaveBeenCalled();
	});

	test('roles retain default policies and unexpired-assignment counting', async () => {
		const deps = mockDeep<RoleServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		const builder = mockDeep<SelectQueryBuilder<import('@/models/_.js').MiRoleAssignment>>();
		builder.where.mockReturnValue(builder);
		builder.andWhere.mockReturnValue(builder);
		builder.getCount.mockResolvedValue(2);
		deps.roleAssignmentsRepository.createQueryBuilder.mockReturnValue(builder);
		const role = fixture<MiRole>({ id: 'role', updatedAt: date, policies: { clipLimit: { useDefault: false, priority: 1, value: 9 } } });
		const pack = createRoleServices(deps).RoleEntityService.pack;
		const packed = await pack(role);
		expect(packed).toMatchObject({ usersCount: 2, policies: { clipLimit: { useDefault: false, priority: 1, value: 9 }, canInvite: { useDefault: true } } });
		expect(builder.where).toHaveBeenCalledWith('assign.roleId = :roleId', { roleId: 'role' });
		expect(role.policies).not.toHaveProperty('canInvite');
	});

	test('antennas retain filters and backward-compatible notification fields', async () => {
		const deps = mockDeep<TimelineServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		const antenna = fixture<MiAntenna>({ id: 'antenna', keywords: [['misskey']], excludeKeywords: [['spam']], localOnly: true, excludeBots: true, excludeNotesInSensitiveChannel: true });
		deps.antennasRepository.findOneByOrFail.mockResolvedValue(antenna);
		const pack = createTimelineServices(deps).AntennaEntityService.pack;
		expect(await pack('antenna')).toMatchObject({ createdAt: date.toISOString(), keywords: [['misskey']], excludeKeywords: [['spam']], localOnly: true, excludeBots: true, excludeNotesInSensitiveChannel: true, hasUnreadNote: false, notify: false });
		expect(deps.antennasRepository.findOneByOrFail).toHaveBeenCalledWith({ id: 'antenna' });
	});
});
