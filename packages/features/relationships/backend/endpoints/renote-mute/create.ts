/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { relationshipContract } from '../../../contract/commands.js';
import ms from '@/runtime-dependencies/ms.js';
import { relationshipErrors } from '@features/relationships/contract';
import { legacyRelationshipSchemas } from '@features/relationships/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

const featureMeta = {
	tags: ['account'],
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:mutes',
	limit: { duration: ms('1hour'), max: 20 },
	errors: relationshipErrors['renote-mute/create'],
} as const;

const featureParamDef = legacyRelationshipSchemas['renote-mute/create'].input;

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('relationshipCommands', commands => createContractTransportEndpoint(meta, paramDef, relationshipContract['renote-mute/create'], async (params, user) => commands['renote-mute/create'](params, {
	context: { actor: user },
})));
