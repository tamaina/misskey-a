/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const packedAntennaSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'name': v.string(),
	'keywords': v.array(v.array(v.string())),
	'excludeKeywords': v.array(v.array(v.string())),
	'src': v.picklist(['home', 'all', 'users', 'list', 'users_blacklist']),
	'userListId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'users': v.array(v.string()),
	'caseSensitive': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'localOnly': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'excludeBots': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'withReplies': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'withFile': v.boolean(),
	'isActive': v.boolean(),
	'hasUnreadNote': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'notify': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'excludeNotesInSensitiveChannel': v.pipe(v.boolean(), v.metadata({ 'default': false })),
});

export type PackedAntenna = v.InferOutput<typeof packedAntennaSchema>;

/** Select the finite public antenna DTO without output validation. */
export function toPackedAntenna(value: PackedAntenna): PackedAntenna {
	return {
		id: value.id,
		createdAt: value.createdAt,
		name: value.name,
		keywords: value.keywords,
		excludeKeywords: value.excludeKeywords,
		src: value.src,
		userListId: value.userListId,
		users: value.users,
		caseSensitive: value.caseSensitive,
		localOnly: value.localOnly,
		excludeBots: value.excludeBots,
		withReplies: value.withReplies,
		withFile: value.withFile,
		isActive: value.isActive,
		hasUnreadNote: value.hasUnreadNote,
		notify: value.notify,
		excludeNotesInSensitiveChannel: value.excludeNotesInSensitiveChannel,
	};
}
