/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { clipFavoriteContract, clipFavoriteErrors } from '@features/collections/contract';
import { legacyClipFavoriteSchemas } from '@features/collections/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['clip'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:clip-favorite',

	errors: clipFavoriteErrors['clips/favorite'],
} as const;

export const paramDef = legacyClipFavoriteSchemas['clips/favorite'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('clipFavoriteCommands', commands => createContractTransportEndpoint(meta, paramDef, clipFavoriteContract['clips/favorite'], async (params, user) => commands['clips/favorite'](params, {
	context: { actor: { id: user.id } },
})));
