/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { collectionsContract } from '../../../contract/index.js';
import { collectionsErrors } from '@features/collections/contract';
import { legacyCollectionsSchemas } from '@features/collections/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: collectionsErrors['clips/remove-note'],
} as const;

export const paramDef = legacyCollectionsSchemas['clips/remove-note'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('collectionCommands', commands => createContractTransportEndpoint(meta, paramDef, collectionsContract['clips/remove-note'], async (params, user) => commands['clips/remove-note'](params, {
	context: { actor: { id: user.id } },
})));
