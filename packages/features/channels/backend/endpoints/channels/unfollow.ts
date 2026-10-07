/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { channelContract, channelErrors } from '@features/channels/contract';
import { legacyChannelSchemas } from '@features/channels/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['channels'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:channels',

	errors: channelErrors['channels/unfollow'],
} as const;

export const paramDef = legacyChannelSchemas['channels/unfollow'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('channelCommands', commands => createContractTransportEndpoint(meta, paramDef, channelContract['channels/unfollow'], async (params, user) => commands['channels/unfollow'](params, {
	context: { actor: user },
})));
