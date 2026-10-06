/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { channelErrors } from '@features/channels/contract';
import { legacyChannelSchemas } from '@features/channels/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['channels', 'mute'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:channels',

	errors: channelErrors['channels/mute/create'],
} as const;

export const paramDef = legacyChannelSchemas['channels/mute/create'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('channelCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['channels/mute/create'](params, {
	context: { actor: user },
})));
