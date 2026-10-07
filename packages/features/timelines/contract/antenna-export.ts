/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { jsonString } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';

/** Portable antenna artifact; importing it retains the existing AJV boundary. */
export const exportedAntenna = jsonObject({
	name: jsonString({ minLength: 1, maxLength: 100 }),
	src: v.picklist(['home', 'all', 'users', 'list', 'users_blacklist']),
	userListAccts: v.optional(v.nullable(v.array(v.string()))),
	keywords: v.array(v.array(v.string())),
	excludeKeywords: v.array(v.array(v.string())),
	users: v.array(v.string()),
	caseSensitive: v.boolean(),
	localOnly: v.optional(v.boolean()),
	excludeBots: v.optional(v.boolean()),
	withReplies: v.boolean(),
	withFile: v.boolean(),
	excludeNotesInSensitiveChannel: v.optional(v.boolean()),
});

export type ExportedAntenna = v.InferOutput<typeof exportedAntenna>;
