/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { NotificationDto } from './notification.schema.js';
import { toPackedNote, toPackedNoteDraft } from '@features/notes/backend/note.schema.js';
import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { toRoleDto } from '@features/roles/backend/role.schema.js';
import { toPackedChatRoomInvitation } from '@features/chat/backend/api.dto.js';

export function toPackedNotification(value: NotificationDto): NotificationDto {
	const common = { id: value.id, createdAt: value.createdAt };
	switch (value.type) {
		case 'note':
		case 'mention':
		case 'reply':
		case 'renote':
		case 'quote':
		case 'pollEnded':
			return { ...common, type: value.type, user: toPackedUserLite(value.user), userId: value.userId, note: toPackedNote(value.note) };
		case 'reaction':
			return { ...common, type: value.type, user: toPackedUserLite(value.user), userId: value.userId, note: toPackedNote(value.note), reaction: value.reaction };
		case 'scheduledNotePosted':
			return { ...common, type: value.type, note: toPackedNote(value.note) };
		case 'scheduledNotePostFailed':
			return { ...common, type: value.type, ...(value.noteDraft === undefined ? {} : { noteDraft: toPackedNoteDraft(value.noteDraft) }) };
		case 'follow':
		case 'receiveFollowRequest':
			return { ...common, type: value.type, user: toPackedUserLite(value.user), userId: value.userId };
		case 'followRequestAccepted':
			return { ...common, type: value.type, user: toPackedUserLite(value.user), userId: value.userId, message: value.message };
		case 'roleAssigned':
			return { ...common, type: value.type, role: toRoleDto(value.role) };
		case 'chatRoomInvitationReceived':
			return { ...common, type: value.type, user: toPackedUserLite(value.user), userId: value.userId, invitation: toPackedChatRoomInvitation(value.invitation) };
		case 'achievementEarned':
			return { ...common, type: value.type, achievement: value.achievement };
		case 'exportCompleted':
			return { ...common, type: value.type, exportedEntity: value.exportedEntity, fileId: value.fileId };
		case 'login':
		case 'createToken':
		case 'test':
			return { ...common, type: value.type };
		case 'app':
			return { ...common, type: value.type, body: value.body, header: value.header, icon: value.icon };
		case 'reaction:grouped':
			return { ...common, type: value.type, note: toPackedNote(value.note), reactions: value.reactions.map(reaction => ({ user: toPackedUserLite(reaction.user), reaction: reaction.reaction })) };
		case 'renote:grouped':
			return { ...common, type: value.type, note: toPackedNote(value.note), users: value.users.map(toPackedUserLite) };
	}
}
