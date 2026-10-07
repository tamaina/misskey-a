/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chatContract } from '../../../../../contract/index.js';
import { chatErrors } from '@features/chat/contract';
import { legacyChatSchemas } from '@features/chat/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['chat'],
	requireCredential: true,
	kind: 'write:chat',
	errors: chatErrors['chat/rooms/invitations/ignore'],
} as const;

export const paramDef = legacyChatSchemas['chat/rooms/invitations/ignore'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('chatCommands', commands => createContractTransportEndpoint(meta, paramDef, chatContract['chat/rooms/invitations/ignore'], async (params, user) => commands['chat/rooms/invitations/ignore'](params, {
	context: { actor: user },
})));
