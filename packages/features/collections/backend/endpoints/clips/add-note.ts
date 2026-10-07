/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { collectionsContract } from '../../../contract/index.js';
import ms from '@/runtime-dependencies/ms.js';
import { collectionsErrors } from '@features/collections/contract';
import { legacyCollectionsSchemas } from '@features/collections/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: collectionsErrors['clips/add-note'],
} as const;

export const paramDef = legacyCollectionsSchemas['clips/add-note'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('collectionCommands', commands => createContractTransportEndpoint(meta, paramDef, collectionsContract['clips/add-note'], async (params, user) => commands['clips/add-note'](params, {
	context: { actor: { id: user.id } },
})));
