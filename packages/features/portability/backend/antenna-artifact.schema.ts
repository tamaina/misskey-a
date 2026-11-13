/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedJsonValueSchema, toPackedJsonValue, type PackedJsonValue } from '../../users/backend/json-value.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';

/** Imported file JSON is queued before antenna domain validation. */
export type AntennaArtifact = PackedJsonValue;
export const antennaArtifactSchema = packedJsonValueSchema;
export function parseAntennaArtifact(text: string): AntennaArtifact {
	const parsed: unknown = JSON.parse(text);
	return toPackedJsonValue(parsed);
}

/** The queue processor validates each entry at the existing domain validation stage. */
export const importedAntennaSchema = objectInput({
	name: v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(100)),
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

export type ExportedAntenna = v.InferOutput<typeof importedAntennaSchema>;
