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
