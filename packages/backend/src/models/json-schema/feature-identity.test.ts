/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { packedSchemas } from '@features/index/contract/packed.js';
import * as schema0 from '@features/announcements/contract/packed.js';
import * as schema1 from '@features/auth/contract/packed.js';
import * as schema2 from '@features/auth/contract/packed.js';
import * as schema3 from '@features/auth/contract/packed.js';
import * as schema4 from '@features/channels/contract/packed.js';
import * as schema5 from '@features/chat/contract/packed.js';
import * as schema6 from '@features/chat/contract/packed.js';
import * as schema7 from '@features/chat/contract/packed.js';
import * as schema8 from '@features/chat/contract/packed.js';
import * as schema9 from '@features/collections/contract/packed.js';
import * as schema10 from '@features/collections/contract/packed.js';
import * as schema11 from '@features/discovery/contract/packed.js';
import * as schema12 from '@features/drive/contract/packed.js';
import * as schema13 from '@features/drive/contract/packed.js';
import * as schema14 from '@features/emojis/contract/packed.js';
import * as schema15 from '@features/federation/contract/packed.js';
import * as schema16 from '@features/gallery/contract/packed.js';
import * as schema17 from '@features/games/contract/packed.js';
import * as schema18 from '@features/instance/contract/packed.js';
import * as schema19 from '@features/instance/contract/packed.js';
import * as schema20 from '@features/integrations/contract/packed.js';
import * as schema21 from '@features/integrations/contract/packed.js';
import * as schema22 from '@features/moderation/contract/packed.js';
import * as schema23 from '@features/notes/contract/packed.js';
import * as schema24 from '@features/notes/contract/packed.js';
import * as schema25 from '@features/notes/contract/packed.js';
import * as schema26 from '@features/notifications/contract/packed.js';
import * as schema27 from '@features/operations/contract/packed.js';
import * as schema28 from '@features/pages/contract/packed.js';
import * as schema29 from '@features/play/contract/packed.js';
import * as schema30 from '@features/relationships/contract/packed.js';
import * as schema31 from '@features/relationships/contract/packed.js';
import * as schema32 from '@features/relationships/contract/packed.js';
import * as schema33 from '@features/relationships/contract/packed.js';
import * as schema34 from '@features/relationships/contract/packed.js';
import * as schema35 from '@features/roles/contract/packed.js';
import * as schema36 from '@features/timelines/contract/packed.js';
import * as schema37 from '@features/users/contract/packed.js';
import * as schema38 from '@features/users/contract/packed.js';

const canonicalSchemas: Array<readonly [keyof typeof packedSchemas, unknown]> = [
	['UserLite', schema38.packedUserLiteSchema],
	['UserDetailedNotMeOnly', schema38.packedUserDetailedNotMeOnlySchema],
	['MeDetailedOnly', schema38.packedMeDetailedOnlySchema],
	['UserDetailedNotMe', schema38.packedUserDetailedNotMeSchema],
	['MeDetailed', schema38.packedMeDetailedSchema],
	['UserDetailed', schema38.packedUserDetailedSchema],
	['User', schema38.packedUserSchema],
	['UserList', schema34.packedUserListSchema],
	['Achievement', schema37.packedAchievementSchema],
	['AchievementName', schema37.packedAchievementNameSchema],
	['Ad', schema18.packedAdSchema],
	['Announcement', schema0.packedAnnouncementSchema],
	['App', schema1.packedAppSchema],
	['Note', schema25.packedNoteSchema],
	['NoteDraft', schema23.packedNoteDraftSchema],
	['NoteReaction', schema24.packedNoteReactionSchema],
	['NoteReactionWithNote', schema24.packedNoteReactionWithNoteSchema],
	['NoteFavorite', schema10.packedNoteFavoriteSchema],
	['Notification', schema26.packedNotificationSchema],
	['DriveFile', schema12.packedDriveFileSchema],
	['DriveFolder', schema13.packedDriveFolderSchema],
	['Following', schema31.packedFollowingSchema],
	['Muting', schema32.packedMutingSchema],
	['RenoteMuting', schema33.packedRenoteMutingSchema],
	['Blocking', schema30.packedBlockingSchema],
	['Hashtag', schema11.packedHashtagSchema],
	['InviteCode', schema2.packedInviteCodeSchema],
	['Page', schema28.packedPageSchema],
	['PageBlock', schema28.packedPageBlockSchema],
	['Channel', schema4.packedChannelSchema],
	['QueueCount', schema27.packedQueueCountSchema],
	['QueueMetrics', schema27.packedQueueMetricsSchema],
	['QueueJob', schema27.packedQueueJobSchema],
	['Antenna', schema36.packedAntennaSchema],
	['Clip', schema9.packedClipSchema],
	['FederationInstance', schema15.packedFederationInstanceSchema],
	['GalleryPost', schema16.packedGalleryPostSchema],
	['EmojiSimple', schema14.packedEmojiSimpleSchema],
	['EmojiDetailed', schema14.packedEmojiDetailedSchema],
	['EmojiDetailedAdmin', schema14.packedEmojiDetailedAdminSchema],
	['Flash', schema29.packedFlashSchema],
	['Signin', schema3.packedSigninSchema],
	['RoleCondFormulaLogics', schema35.packedRoleCondFormulaLogicsSchema],
	['RoleCondFormulaValueNot', schema35.packedRoleCondFormulaValueNot],
	['RoleCondFormulaValueIsLocalOrRemote', schema35.packedRoleCondFormulaValueIsLocalOrRemoteSchema],
	['RoleCondFormulaValueUserSettingBooleanSchema', schema35.packedRoleCondFormulaValueUserSettingBooleanSchema],
	['RoleCondFormulaValueAssignedRole', schema35.packedRoleCondFormulaValueAssignedRoleSchema],
	['RoleCondFormulaValueCreated', schema35.packedRoleCondFormulaValueCreatedSchema],
	['RoleCondFormulaFollowersOrFollowingOrNotes', schema35.packedRoleCondFormulaFollowersOrFollowingOrNotesSchema],
	['RoleCondFormulaValue', schema35.packedRoleCondFormulaValueSchema],
	['RoleLite', schema35.packedRoleLiteSchema],
	['Role', schema35.packedRoleSchema],
	['RolePolicies', schema35.packedRolePoliciesSchema],
	['ReversiGameLite', schema17.packedReversiGameLiteSchema],
	['ReversiGameDetailed', schema17.packedReversiGameDetailedSchema],
	['MetaLite', schema19.packedMetaLiteSchema],
	['MetaDetailedOnly', schema19.packedMetaDetailedOnlySchema],
	['MetaDetailed', schema19.packedMetaDetailedSchema],
	['MetaClientOptions', schema19.packedMetaClientOptionsSchema],
	['UserWebhook', schema21.packedUserWebhookSchema],
	['SystemWebhook', schema20.packedSystemWebhookSchema],
	['AbuseReportNotificationRecipient', schema22.packedAbuseReportNotificationRecipientSchema],
	['ChatMessage', schema5.packedChatMessageSchema],
	['ChatMessageLite', schema5.packedChatMessageLiteSchema],
	['ChatMessageLiteFor1on1', schema5.packedChatMessageLiteFor1on1Schema],
	['ChatMessageLiteForRoom', schema5.packedChatMessageLiteForRoomSchema],
	['ChatRoom', schema8.packedChatRoomSchema],
	['ChatRoomInvitation', schema6.packedChatRoomInvitationSchema],
	['ChatRoomMembership', schema7.packedChatRoomMembershipSchema],
];

for (const [name, canonicalSchema] of canonicalSchemas) {
	test(`${name} packed schema uses its canonical feature definition`, () => {
		expect(packedSchemas[name]).toBe(canonicalSchema);
	});
}

test('packed schemas parse recursive notes and validate referenced users', () => {
	const user = {
		id: 'user-id',
		name: null,
		username: 'alice',
		host: null,
		avatarUrl: 'https://example.test/avatar.png',
		avatarBlurhash: null,
		avatarDecorations: [],
		emojis: {},
		onlineStatus: 'unknown',
	};
	const note = {
		id: 'note-id',
		createdAt: '2026-01-01T00:00:00.000Z',
		text: null,
		userId: user.id,
		user,
		visibility: 'public',
		reactionAcceptance: null,
		reactionEmojis: {},
		reactions: {},
		reactionCount: 0,
		renoteCount: 0,
		repliesCount: 0,
	};
	const recursiveNote = { ...note, reply: note };

	expect(v.safeParse(packedSchemas.Note, recursiveNote).success).toBe(true);
	expect(v.parse(packedSchemas.Note, { ...recursiveNote, futureField: { preserved: true } })).toHaveProperty('futureField', { preserved: true });
	expect(v.safeParse(packedSchemas.Note, { ...note, user: { ...user, username: 1 } }).success).toBe(false);
});

test('legacy dynamic page blocks and opaque fields survive packing', () => {
	const block = {
		id: 'legacy-if', type: 'if', expression: 'old-variable',
		children: [{ id: 'legacy-input', type: 'textInput', default: 'preserved' }],
	};
	expect(v.parse(packedSchemas.PageBlock, block)).toEqual(block);
	expect(v.safeParse(packedSchemas.PageBlock, { id: 's', type: 'section' }).success).toBe(false);
});

test('queue progress accepts Bull values and results remain opaque', () => {
	const job = {
		id: 'job', name: 'job', data: { nested: true }, opts: { attempts: 2 },
		timestamp: 0, progress: 0, attempts: 0, delay: 0, failedReason: '',
		stacktrace: [], returnValue: null, isFailed: false,
	};
	for (const progress of [0, 'working', true, { done: 1 }, [1, 2]]) {
		expect(v.parse(packedSchemas.QueueJob, { ...job, progress }).progress).toEqual(progress);
	}
	for (const returnValue of [null, 'done', 1, false, { value: 1 }, [1]]) {
		expect(v.parse(packedSchemas.QueueJob, { ...job, returnValue }).returnValue).toEqual(returnValue);
	}
});

test('page content preserves opaque historical blocks without pretending they are typed blocks', () => {
	const content = [{ type: 'extension-block', pluginData: { old: true } }, {}];
	expect(v.parse(packedSchemas.Page.entries.content, content)).toEqual(content);
	expect(v.safeParse(packedSchemas.Page.entries.content, [42]).success).toBe(false);
});

test('sparse stored role policies remain valid without filling defaults', () => {
	const role = {
		id: 'role', name: 'Role', color: null, iconUrl: null, description: '',
		isModerator: false, isAdministrator: false, displayOrder: 0,
		createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
		target: 'conditional', condFormula: { id: 'root', type: 'and', values: [
			{ id: 'not', type: 'not', value: { id: 'local', type: 'isLocal' } },
		] },
		isPublic: false, isExplorable: false, asBadge: false,
		preserveAssignmentOnMoveAccount: false, canEditMembersByModerator: false,
		policies: { canInvite: {}, mentionLimit: { value: 3 } }, usersCount: 0,
	};
	expect(v.parse(packedSchemas.Role, role)).toEqual(role);
	expect(v.safeParse(packedSchemas.RoleCondFormulaValue, { id: 'bad', type: 'not' }).success).toBe(false);
	expect(v.safeParse(packedSchemas.RoleCondFormulaValue, { id: 'bad', type: 'and' }).success).toBe(false);
});
