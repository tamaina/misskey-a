/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { clipFavoriteErrors } from '@features/collections/contract';
import { legacyClipFavoriteSchemas } from '@features/collections/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['clip'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:clip-favorite',

	errors: clipFavoriteErrors['clips/unfavorite'],
} as const;

export const paramDef = legacyClipFavoriteSchemas['clips/unfavorite'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('clipFavoriteCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['clips/unfavorite'](params, {
	context: { actor: { id: user.id } },
})));
