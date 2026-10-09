/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@features/index/backend/packed.schema.js';
import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
export function toPackedChatRoom(value: Packed<'ChatRoom'>): Packed<'ChatRoom'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		ownerId: value.ownerId,
		owner: toPackedUserLite(value.owner),
		name: value.name,
		description: value.description,
		isMuted: value.isMuted,
		invitationExists: value.invitationExists,
	};
}
export function toPackedChatRoomInvitation(value: Packed<'ChatRoomInvitation'>): Packed<'ChatRoomInvitation'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		userId: value.userId,
		user: toPackedUserLite(value.user),
		roomId: value.roomId,
		room: toPackedChatRoom(value.room),
	};
}
export function toPackedChatRoomMembership(value: Packed<'ChatRoomMembership'>): Packed<'ChatRoomMembership'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		userId: value.userId,
		user: value.user === undefined ? undefined : toPackedUserLite(value.user),
		roomId: value.roomId,
		room: value.room === undefined ? undefined : toPackedChatRoom(value.room),
	};
}
export function toPackedChatMessage(value: Packed<'ChatMessage'>): Packed<'ChatMessage'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		fromUserId: value.fromUserId,
		fromUser: toPackedUserLite(value.fromUser),
		toUserId: value.toUserId,
		toUser: value.toUser === undefined ? undefined : value.toUser === null ? null : toPackedUserLite(value.toUser),
		toRoomId: value.toRoomId,
		toRoom: value.toRoom === undefined ? undefined : value.toRoom === null ? null : toPackedChatRoom(value.toRoom),
		text: value.text,
		fileId: value.fileId,
		file: value.file === undefined ? undefined : value.file === null ? null : toPackedDriveFile(value.file),
		isRead: value.isRead,
		reactions: value.reactions.map(item => ({ reaction: item.reaction, user: toPackedUserLite(item.user) })),
	};
}
export function toPackedChatMessageLiteFor1on1(value: Packed<'ChatMessageLiteFor1on1'>): Packed<'ChatMessageLiteFor1on1'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		fromUserId: value.fromUserId,
		toUserId: value.toUserId,
		text: value.text,
		fileId: value.fileId,
		file: value.file === undefined ? undefined : value.file === null ? null : toPackedDriveFile(value.file),
		reactions: value.reactions.map(item => ({ reaction: item.reaction })),
	};
}
export function toPackedChatMessageLiteForRoom(value: Packed<'ChatMessageLiteForRoom'>): Packed<'ChatMessageLiteForRoom'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		fromUserId: value.fromUserId,
		fromUser: toPackedUserLite(value.fromUser),
		toRoomId: value.toRoomId,
		text: value.text,
		fileId: value.fileId,
		file: value.file === undefined ? undefined : value.file === null ? null : toPackedDriveFile(value.file),
		reactions: value.reactions.map(item => ({ reaction: item.reaction, user: toPackedUserLite(item.user) })),
	};
}
