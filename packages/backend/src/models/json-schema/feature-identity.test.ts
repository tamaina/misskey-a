/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { packedSchemas } from '@features/index/backend/packed.schema.js';
import {
	packedAnnouncementSchema,
} from '@features/users/backend/user-related.schema.js';

import {
	packedAppSchema,
	packedInviteCodeSchema,
	packedSigninSchema,
} from '@features/auth/backend/auth.schema.js';

import {
	packedChannelSchema,
} from '@features/channels/backend/channel.schema.js';

import {
	packedChatMessageSchema,
	packedChatMessageLiteSchema,
	packedChatMessageLiteFor1on1Schema,
	packedChatMessageLiteForRoomSchema,
	packedChatRoomSchema,
	packedChatRoomInvitationSchema,
	packedChatRoomMembershipSchema,
} from '@features/chat/backend/chat.schema.js';

import {
	packedNoteFavoriteSchema,
	packedClipSchema,
} from '@features/collections/backend/api.schema.js';

import {
	packedHashtagSchema,
} from '@features/discovery/backend/endpoints/hashtag.schema.js';

import {
	packedDriveFileSchema,
	packedDriveFolderSchema,
} from '@features/notes/backend/drive.schema.js';

import {
	emojiSimpleResult as packedEmojiSimpleSchema,
	emojiDetailedResult as packedEmojiDetailedSchema,
	packedEmojiDetailedAdminSchema,
} from '@features/emojis/backend/api.schema.js';

import {
	federationInstanceSchema as packedFederationInstanceSchema,
} from '@features/federation/backend/federation.schema.js';

import {
	packedGalleryPostSchema,
} from '@features/collections/backend/api.schema.js';

import {
	packedReversiGameLiteSchema,
	packedReversiGameDetailedSchema,
} from '@features/games/backend/reversi.schema.js';

import {
	packedAdSchema,
	packedMetaLiteSchema,
	packedMetaDetailedOnlySchema,
	packedMetaDetailedSchema,
	packedMetaClientOptionsSchema,
} from '@features/instance/backend/endpoints/meta.schema.js';

import {
	userWebhookSchema as packedUserWebhookSchema,
	systemWebhookSchema as packedSystemWebhookSchema,
} from '@features/integrations/backend/webhook.schema.js';

import {
	adminAbuseReportNotificationRecipientCreateOutput as packedAbuseReportNotificationRecipientSchema,
} from '@features/moderation/backend/api.schema.js';

import {
	packedNoteSchema,
	packedNoteDraftSchema,
	packedNoteReactionSchema,
	packedNoteReactionWithNoteSchema,
} from '@features/notes/backend/note.schema.js';

import {
	packedNotificationSchema,
} from '@features/notifications/backend/notification.schema.js';

import {
	queueCounterSchema as packedQueueCountSchema,
	queueMetricsSchema as packedQueueMetricsSchema,
	queueJobSchema as packedQueueJobSchema,
} from '@features/operations/backend/queue.schema.js';

import {
	packedPageSchema,
} from '@features/users/backend/page.schema.js';

import {
	packedFlashSchema,
} from '@features/play/backend/flash.schema.js';

import {
	packedUserListSchema,
	packedFollowingSchema,
	packedMutingSchema,
	packedRenoteMutingSchema,
	packedBlockingSchema,
} from '@features/relationships/backend/endpoints/relationships.schema.js';

import {
	packedRoleCondFormulaLogicsSchema,
	packedRoleCondFormulaValueNot,
	packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	packedRoleCondFormulaValueUserSettingBooleanSchema,
	packedRoleCondFormulaValueAssignedRoleSchema,
	packedRoleCondFormulaValueCreatedSchema,
	packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	packedRoleLiteSchema,
	packedRolePoliciesSchema,
} from '@features/notifications/backend/notification-related.schema.js';

import {
	packedAntennaSchema,
} from '@features/timelines/backend/antenna.schema.js';

import {
	packedUserLiteSchema,
	packedUserDetailedNotMeOnlySchema,
	packedMeDetailedOnlySchema,
	packedUserDetailedNotMeSchema,
	packedMeDetailedSchema,
	packedUserDetailedSchema,
	packedUserSchema,
	packedAchievementSchema,
	packedAchievementNameSchema,
} from '@features/users/backend/user.schema.js';

import { packedPageBlockSchema } from '@features/pages/backend/page-block.schema.js';

import { packedRoleSchema, packedRoleCondFormulaValueSchema } from '@features/roles/backend/role.schema.js';

const nativeDtoBindings: Array<readonly [keyof typeof packedSchemas, unknown]> = [
	['UserLite', packedUserLiteSchema],
	['UserDetailedNotMeOnly', packedUserDetailedNotMeOnlySchema],
	['MeDetailedOnly', packedMeDetailedOnlySchema],
	['UserDetailedNotMe', packedUserDetailedNotMeSchema],
	['MeDetailed', packedMeDetailedSchema],
	['UserDetailed', packedUserDetailedSchema],
	['User', packedUserSchema],
	['UserList', packedUserListSchema],
	['Achievement', packedAchievementSchema],
	['AchievementName', packedAchievementNameSchema],
	['Ad', packedAdSchema],
	['Announcement', packedAnnouncementSchema],
	['App', packedAppSchema],
	['Note', packedNoteSchema],
	['NoteDraft', packedNoteDraftSchema],
	['NoteReaction', packedNoteReactionSchema],
	['NoteReactionWithNote', packedNoteReactionWithNoteSchema],
	['NoteFavorite', packedNoteFavoriteSchema],
	['Notification', packedNotificationSchema],
	['DriveFile', packedDriveFileSchema],
	['DriveFolder', packedDriveFolderSchema],
	['Following', packedFollowingSchema],
	['Muting', packedMutingSchema],
	['RenoteMuting', packedRenoteMutingSchema],
	['Blocking', packedBlockingSchema],
	['Hashtag', packedHashtagSchema],
	['InviteCode', packedInviteCodeSchema],
	['Page', packedPageSchema],
	['PageBlock', packedPageBlockSchema],
	['Channel', packedChannelSchema],
	['QueueCount', packedQueueCountSchema],
	['QueueMetrics', packedQueueMetricsSchema],
	['QueueJob', packedQueueJobSchema],
	['Antenna', packedAntennaSchema],
	['Clip', packedClipSchema],
	['FederationInstance', packedFederationInstanceSchema],
	['GalleryPost', packedGalleryPostSchema],
	['EmojiSimple', packedEmojiSimpleSchema],
	['EmojiDetailed', packedEmojiDetailedSchema],
	['EmojiDetailedAdmin', packedEmojiDetailedAdminSchema],
	['Flash', packedFlashSchema],
	['Signin', packedSigninSchema],
	['RoleCondFormulaLogics', packedRoleCondFormulaLogicsSchema],
	['RoleCondFormulaValueNot', packedRoleCondFormulaValueNot],
	['RoleCondFormulaValueIsLocalOrRemote', packedRoleCondFormulaValueIsLocalOrRemoteSchema],
	['RoleCondFormulaValueUserSettingBooleanSchema', packedRoleCondFormulaValueUserSettingBooleanSchema],
	['RoleCondFormulaValueAssignedRole', packedRoleCondFormulaValueAssignedRoleSchema],
	['RoleCondFormulaValueCreated', packedRoleCondFormulaValueCreatedSchema],
	['RoleCondFormulaFollowersOrFollowingOrNotes', packedRoleCondFormulaFollowersOrFollowingOrNotesSchema],
	['RoleCondFormulaValue', packedRoleCondFormulaValueSchema],
	['RoleLite', packedRoleLiteSchema],
	['Role', packedRoleSchema],
	['RolePolicies', packedRolePoliciesSchema],
	['ReversiGameLite', packedReversiGameLiteSchema],
	['ReversiGameDetailed', packedReversiGameDetailedSchema],
	['MetaLite', packedMetaLiteSchema],
	['MetaDetailedOnly', packedMetaDetailedOnlySchema],
	['MetaDetailed', packedMetaDetailedSchema],
	['MetaClientOptions', packedMetaClientOptionsSchema],
	['UserWebhook', packedUserWebhookSchema],
	['SystemWebhook', packedSystemWebhookSchema],
	['AbuseReportNotificationRecipient', packedAbuseReportNotificationRecipientSchema],
	['ChatMessage', packedChatMessageSchema],
	['ChatMessageLite', packedChatMessageLiteSchema],
	['ChatMessageLiteFor1on1', packedChatMessageLiteFor1on1Schema],
	['ChatMessageLiteForRoom', packedChatMessageLiteForRoomSchema],
	['ChatRoom', packedChatRoomSchema],
	['ChatRoomInvitation', packedChatRoomInvitationSchema],
	['ChatRoomMembership', packedChatRoomMembershipSchema],
];

test('all 69 packed models bind directly to their native feature DTO', () => {
	expect(nativeDtoBindings).toHaveLength(69);
	expect(Object.keys(packedSchemas).sort()).toEqual(nativeDtoBindings.map(([name]) => name).sort());
	for (const [name, schema] of nativeDtoBindings) expect(packedSchemas[name], name).toBe(schema);
});

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
	expect(v.safeParse(packedSchemas.Note, { ...recursiveNote, futureField: { preserved: true } }).success).toBe(false);
	expect(v.safeParse(packedSchemas.Note, { ...recursiveNote, reply: { ...note, futureField: true } }).success).toBe(false);
	expect(v.safeParse(packedSchemas.Note, { ...note, user: { ...user, username: 1 } }).success).toBe(false);
});

test('historical page program blocks preserve their JSON extension fields', () => {
	const block = {
		id: 'legacy-if', type: 'if', expression: 'old-variable',
		children: [{ id: 'legacy-input', type: 'textInput', default: 'preserved' }],
	};
	expect(v.parse(packedSchemas.PageBlock, block)).toEqual(block);
	expect(v.safeParse(packedSchemas.PageBlock, { id: 's', type: 'section' }).success).toBe(false);
});

test('queue progress and results retain genuine JSON values', () => {
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

test('page content retains historical and extension-defined JSON objects', () => {
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
