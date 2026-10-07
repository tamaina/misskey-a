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

	errors: channelErrors['channels/follow'],
} as const;

export const paramDef = legacyChannelSchemas['channels/follow'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('channelCommands', commands => createContractTransportEndpoint(meta, paramDef, channelContract['channels/follow'], async (params, user) => commands['channels/follow'](params, {
	context: { actor: user },
})));
