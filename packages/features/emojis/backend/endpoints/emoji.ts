/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { emojisContract } from '../../contract/index.js';
import { legacyEmojiSchemas } from '@features/emojis/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['meta'],
	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,
	res: legacyEmojiSchemas.output as Schema,
} as const;

export const paramDef = legacyEmojiSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('emojis', emojis => createContractTransportEndpoint(meta, paramDef, emojisContract['emoji'], async params => emojis.emoji(params)));
