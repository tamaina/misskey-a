/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyEmojiSchemas } from '@features/emojis/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['meta'],
	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,
	res: legacyEmojiSchemas.output as Schema,
} as const;

export const paramDef = legacyEmojiSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('emojis', emojis => new Endpoint(meta, paramDef, async params => emojis.emoji(params)));
