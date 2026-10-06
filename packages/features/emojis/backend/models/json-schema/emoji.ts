/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyEmojiSimpleSchema, legacyEmojiDetailedSchema } from '@features/emojis/backend';
import type { Schema } from '@/misc/json-schema.js';

// Public emoji models are generated from the feature contract. Admin stays legacy.
export const packedEmojiSimpleSchema = legacyEmojiSimpleSchema as Schema;
export const packedEmojiDetailedSchema = legacyEmojiDetailedSchema as Schema;

export const packedEmojiDetailedAdminSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'id',
			optional: false, nullable: false,
		},
		updatedAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: true,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		host: {
			type: 'string',
			optional: false, nullable: true,
			description: 'The local host is represented with `null`.',
		},
		publicUrl: {
			type: 'string',
			optional: false, nullable: false,
		},
		originalUrl: {
			type: 'string',
			optional: false, nullable: false,
		},
		uri: {
			type: 'string',
			optional: false, nullable: true,
		},
		type: {
			type: 'string',
			optional: false, nullable: true,
		},
		aliases: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				format: 'id',
				optional: false, nullable: false,
			},
		},
		category: {
			type: 'string',
			optional: false, nullable: true,
		},
		license: {
			type: 'string',
			optional: false, nullable: true,
		},
		localOnly: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		roleIdsThatCanBeUsedThisEmojiAsReaction: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						format: 'misskey:id',
						optional: false, nullable: false,
					},
					name: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
			},
		},
	},
} as const;
