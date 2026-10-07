/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { clipFavoriteContract, clipFavoriteErrors } from '@features/collections/contract';
import { legacyClipFavoriteSchemas } from '@features/collections/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

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
