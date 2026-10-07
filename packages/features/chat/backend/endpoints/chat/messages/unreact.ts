/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chatContract } from '../../../../contract/index.js';
import { chatErrors } from '@features/chat/contract';
import { legacyChatSchemas } from '@features/chat/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['chat'],
	requireCredential: true,
	kind: 'write:chat',
	errors: chatErrors['chat/messages/unreact'],
} as const;

export const paramDef = legacyChatSchemas['chat/messages/unreact'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('chatCommands', commands => createContractTransportEndpoint(meta, paramDef, chatContract['chat/messages/unreact'], async (params, user) => commands['chat/messages/unreact'](params, {
	context: { actor: user },
})));
