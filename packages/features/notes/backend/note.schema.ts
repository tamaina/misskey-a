/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { toPackedRecord } from '../../users/backend/json-value.schema.js';
import { toPackedUserLite } from '../../users/backend/user.schema.js';
import { toPackedDriveFile } from './drive.schema.js';
import {
	packedUserLiteSchema as __ref_UserLite,
} from '../../users/backend/user.schema.js';
import {
	packedDriveFileSchema as __ref_DriveFile,
} from './drive.schema.js';

const noteBaseSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'deletedAt': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' }))),
	'text': v.nullable(v.string()),
	'cw': v.optional(v.nullable(v.string())),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': v.lazy(() => __ref_UserLite),
	'replyId': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' }))),
	'renoteId': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' }))),
	'isHidden': v.optional(v.boolean()),
	'visibility': v.picklist(['public', 'home', 'followers', 'specified']),
	'mentions': v.optional(v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' })))),
	'visibleUserIds': v.optional(v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' })))),
	'fileIds': v.optional(v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' })))),
	'files': v.optional(v.array(v.lazy(() => __ref_DriveFile))),
	'tags': v.optional(v.array(v.string())),
	'poll': v.optional(v.nullable(v.strictObject({
		'expiresAt': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' }))),
		'multiple': v.boolean(),
		'choices': v.array(v.strictObject({
			'isVoted': v.boolean(),
			'text': v.string(),
			'votes': v.number(),
		})),
	}))),
	'emojis': v.optional(v.record(v.string(), v.union([v.string()]))),
	'channelId': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' }))),
	'channel': v.optional(v.nullable(v.strictObject({
		'id': v.string(),
		'name': v.string(),
		'color': v.string(),
		'isSensitive': v.boolean(),
		'allowRenoteToExternal': v.boolean(),
		'userId': v.nullable(v.string()),
	}))),
	'localOnly': v.optional(v.boolean()),
	'reactionAcceptance': v.union([v.picklist(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote']), v.null()]),
	'reactionEmojis': v.record(v.string(), v.union([v.string()])),
	'reactions': v.record(v.string(), v.union([v.number()])),
	'reactionCount': v.number(),
	'renoteCount': v.number(),
	'repliesCount': v.number(),
	'uri': v.optional(v.string()),
	'url': v.optional(v.string()),
	'reactionAndUserPairCache': v.optional(v.array(v.string())),
	'clippedCount': v.optional(v.number()),
	'hasPoll': v.optional(v.boolean()),
	'myReaction': v.optional(v.nullable(v.string())),
});
export type PackedNote = v.InferOutput<typeof noteBaseSchema> & { reply?: PackedNote | null | undefined; renote?: PackedNote | null | undefined };
export const packedNoteSchema: v.GenericSchema<PackedNote, PackedNote> = v.strictObject({
	...noteBaseSchema.entries,
	'reply': v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	'renote': v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
});
export const packedNoteDraftSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'text': v.nullable(v.string()),
	'cw': v.nullable(v.string()),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': v.lazy(() => __ref_UserLite),
	'replyId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'renoteId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'reply': v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	'renote': v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	'visibility': v.picklist(['public', 'home', 'followers', 'specified']),
	'visibleUserIds': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'fileIds': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'files': v.optional(v.array(v.lazy(() => __ref_DriveFile))),
	'hashtag': v.nullable(v.string()),
	'poll': v.nullable(v.strictObject({
		'expiresAt': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' }))),
		'expiredAfter': v.optional(v.nullable(v.number())),
		'multiple': v.boolean(),
		'choices': v.array(v.string()),
	})),
	'channelId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'channel': v.optional(v.nullable(v.strictObject({
		'id': v.string(),
		'name': v.string(),
		'color': v.string(),
		'isSensitive': v.boolean(),
		'allowRenoteToExternal': v.boolean(),
		'userId': v.nullable(v.string()),
	}))),
	'localOnly': v.boolean(),
	'reactionAcceptance': v.union([v.picklist(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote']), v.null()]),
	'scheduledAt': v.nullable(v.number()),
	'isActuallyScheduled': v.boolean(),
});
export const packedNoteReactionSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'user': v.lazy(() => __ref_UserLite),
	'type': v.string(),
});
export const packedNoteReactionWithNoteSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'user': v.lazy(() => __ref_UserLite),
	'type': v.string(),
	'note': v.lazy(() => packedNoteSchema),
});

/** Select the finite public DTO explicitly, including nested serializer output. */
export function toPackedNote(value: PackedNote): PackedNote {
	return {
		id: value.id,
		createdAt: value.createdAt,
		deletedAt: (value.deletedAt === undefined ? undefined : (value.deletedAt === null ? null : value.deletedAt)),
		text: (value.text === null ? null : value.text),
		cw: (value.cw === undefined ? undefined : (value.cw === null ? null : value.cw)),
		userId: value.userId,
		user: toPackedUserLite(value.user),
		replyId: (value.replyId === undefined ? undefined : (value.replyId === null ? null : value.replyId)),
		renoteId: (value.renoteId === undefined ? undefined : (value.renoteId === null ? null : value.renoteId)),
		isHidden: (value.isHidden === undefined ? undefined : value.isHidden),
		visibility: value.visibility,
		mentions: (value.mentions === undefined ? undefined : value.mentions.map(item2 => item2)),
		visibleUserIds: (value.visibleUserIds === undefined ? undefined : value.visibleUserIds.map(item2 => item2)),
		fileIds: (value.fileIds === undefined ? undefined : value.fileIds.map(item2 => item2)),
		files: (value.files === undefined ? undefined : value.files.map(item2 => toPackedDriveFile(item2))),
		tags: (value.tags === undefined ? undefined : value.tags.map(item2 => item2)),
		poll: (value.poll === undefined ? undefined : (value.poll === null ? null : {
			expiresAt: (value.poll.expiresAt === undefined ? undefined : (value.poll.expiresAt === null ? null : value.poll.expiresAt)),
			multiple: value.poll.multiple,
			choices: value.poll.choices.map(item3 => ({
					isVoted: item3.isVoted,
					text: item3.text,
					votes: item3.votes,
				})),
		})),
		emojis: (value.emojis === undefined ? undefined : toPackedRecord(value.emojis)),
		channelId: (value.channelId === undefined ? undefined : (value.channelId === null ? null : value.channelId)),
		channel: (value.channel === undefined ? undefined : (value.channel === null ? null : {
			id: value.channel.id,
			name: value.channel.name,
			color: value.channel.color,
			isSensitive: value.channel.isSensitive,
			allowRenoteToExternal: value.channel.allowRenoteToExternal,
			userId: (value.channel.userId === null ? null : value.channel.userId),
		})),
		localOnly: (value.localOnly === undefined ? undefined : value.localOnly),
		reactionAcceptance: value.reactionAcceptance,
		reactionEmojis: toPackedRecord(value.reactionEmojis),
		reactions: toPackedRecord(value.reactions),
		reactionCount: value.reactionCount,
		renoteCount: value.renoteCount,
		repliesCount: value.repliesCount,
		uri: (value.uri === undefined ? undefined : value.uri),
		url: (value.url === undefined ? undefined : value.url),
		reactionAndUserPairCache: (value.reactionAndUserPairCache === undefined ? undefined : value.reactionAndUserPairCache.map(item2 => item2)),
		clippedCount: (value.clippedCount === undefined ? undefined : value.clippedCount),
		hasPoll: (value.hasPoll === undefined ? undefined : value.hasPoll),
		myReaction: (value.myReaction === undefined ? undefined : (value.myReaction === null ? null : value.myReaction)),
		reply: (value.reply === undefined ? undefined : (value.reply === null ? null : toPackedNote(value.reply))),
		renote: (value.renote === undefined ? undefined : (value.renote === null ? null : toPackedNote(value.renote))),
	};
}

/** Select the finite public DTO explicitly, including nested serializer output. */
export function toPackedNoteDraft(value: v.InferOutput<typeof packedNoteDraftSchema>): v.InferOutput<typeof packedNoteDraftSchema> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		text: (value.text === null ? null : value.text),
		cw: (value.cw === null ? null : value.cw),
		userId: value.userId,
		user: toPackedUserLite(value.user),
		replyId: (value.replyId === null ? null : value.replyId),
		renoteId: (value.renoteId === null ? null : value.renoteId),
		reply: (value.reply === undefined ? undefined : (value.reply === null ? null : toPackedNote(value.reply))),
		renote: (value.renote === undefined ? undefined : (value.renote === null ? null : toPackedNote(value.renote))),
		visibility: value.visibility,
		visibleUserIds: value.visibleUserIds.map(item2 => item2),
		fileIds: value.fileIds.map(item2 => item2),
		files: (value.files === undefined ? undefined : value.files.map(item2 => toPackedDriveFile(item2))),
		hashtag: (value.hashtag === null ? null : value.hashtag),
		poll: (value.poll === null ? null : {
			expiresAt: (value.poll.expiresAt === undefined ? undefined : (value.poll.expiresAt === null ? null : value.poll.expiresAt)),
			expiredAfter: (value.poll.expiredAfter === undefined ? undefined : (value.poll.expiredAfter === null ? null : value.poll.expiredAfter)),
			multiple: value.poll.multiple,
			choices: value.poll.choices.map(item3 => item3),
		}),
		channelId: (value.channelId === null ? null : value.channelId),
		channel: (value.channel === undefined ? undefined : (value.channel === null ? null : {
			id: value.channel.id,
			name: value.channel.name,
			color: value.channel.color,
			isSensitive: value.channel.isSensitive,
			allowRenoteToExternal: value.channel.allowRenoteToExternal,
			userId: (value.channel.userId === null ? null : value.channel.userId),
		})),
		localOnly: value.localOnly,
		reactionAcceptance: value.reactionAcceptance,
		scheduledAt: (value.scheduledAt === null ? null : value.scheduledAt),
		isActuallyScheduled: value.isActuallyScheduled,
	};
}

/** Select the finite public DTO explicitly, including nested serializer output. */
export function toPackedNoteReaction(value: v.InferOutput<typeof packedNoteReactionSchema>): v.InferOutput<typeof packedNoteReactionSchema> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		user: toPackedUserLite(value.user),
		type: value.type,
	};
}

/** Select the finite public DTO explicitly, including nested serializer output. */
export function toPackedNoteReactionWithNote(value: v.InferOutput<typeof packedNoteReactionWithNoteSchema>): v.InferOutput<typeof packedNoteReactionWithNoteSchema> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		user: toPackedUserLite(value.user),
		type: value.type,
		note: toPackedNote(value.note),
	};
}
