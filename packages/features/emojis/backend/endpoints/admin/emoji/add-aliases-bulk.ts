/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { emojisContract } from '../../../../contract/index.js';
import { legacyEmojiAdministrationSchemas } from '@features/emojis/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',
} as const;

export const paramDef = legacyEmojiAdministrationSchemas['admin/emoji/add-aliases-bulk'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('emojiAdministration', emojiAdministration => createContractTransportEndpoint(meta, paramDef, emojisContract['admin/emoji/add-aliases-bulk'], async params =>
	emojiAdministration['admin/emoji/add-aliases-bulk'](params)));
