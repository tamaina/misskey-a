/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedUserLiteSchema } from '../../users/backend/user.schema.js';
import { packedNoteSchema } from './note.schema.js';
import { packedDriveFileSchema } from './drive.schema.js';

export const packedNoteDraftSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'text': v.nullable(v.string()),
	'cw': v.nullable(v.string()),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': v.lazy(() => packedUserLiteSchema),
	'replyId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'renoteId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'reply': v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	'renote': v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	'visibility': v.picklist(['public', 'home', 'followers', 'specified']),
	'visibleUserIds': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'fileIds': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'files': v.optional(v.array(v.lazy(() => packedDriveFileSchema))),
	'hashtag': v.nullable(v.string()),
	'poll': v.nullable(v.strictObject({
		'expiresAt': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' }))),
		'expiredAfter': v.optional(v.nullable(v.pipe(v.number(), v.finite()))),
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
	'scheduledAt': v.nullable(v.pipe(v.number(), v.finite())),
	'isActuallyScheduled': v.boolean(),
});
export const packedNoteReactionSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'user': v.lazy(() => packedUserLiteSchema),
	'type': v.string(),
});
export const packedNoteReactionWithNoteSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'user': v.lazy(() => packedUserLiteSchema),
	'type': v.string(),
	'note': v.lazy(() => packedNoteSchema),
});
