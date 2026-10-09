/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const packedHashtagSchema = v.strictObject({
	'tag': v.pipe(v.string(), v.metadata({ 'example': 'misskey' })),
	'mentionedUsersCount': v.pipe(v.number(), v.finite()),
	'mentionedLocalUsersCount': v.pipe(v.number(), v.finite()),
	'mentionedRemoteUsersCount': v.pipe(v.number(), v.finite()),
	'attachedUsersCount': v.pipe(v.number(), v.finite()),
	'attachedLocalUsersCount': v.pipe(v.number(), v.finite()),
	'attachedRemoteUsersCount': v.pipe(v.number(), v.finite()),
});
