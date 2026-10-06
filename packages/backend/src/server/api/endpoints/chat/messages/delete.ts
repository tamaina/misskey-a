/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chatErrors } from '@features/chat/contract';
import { legacyChatSchemas } from '@features/chat/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['chat'],
	requireCredential: true,
	kind: 'write:chat',
	errors: chatErrors['chat/messages/delete'],
} as const;

export const paramDef = legacyChatSchemas['chat/messages/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('chatCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['chat/messages/delete'](params, {
	context: { actor: user },
})));
