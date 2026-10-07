/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { emojisContract } from '../../../../contract/index.js';
import { legacyEmojiAdministrationSchemas } from '@features/emojis/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',
} as const;

export const paramDef = legacyEmojiAdministrationSchemas['admin/emoji/set-category-bulk'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('emojiAdministration', emojiAdministration => createContractTransportEndpoint(meta, paramDef, emojisContract['admin/emoji/set-category-bulk'], async params =>
	emojiAdministration['admin/emoji/set-category-bulk'](params)));
