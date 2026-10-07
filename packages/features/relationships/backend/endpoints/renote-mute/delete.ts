/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { relationshipContract } from '../../../contract/commands.js';
import { relationshipErrors } from '@features/relationships/contract';
import { legacyRelationshipSchemas } from '@features/relationships/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

const featureMeta = {
	tags: ['account'],
	requireCredential: true,
	kind: 'write:mutes',
	errors: relationshipErrors['renote-mute/delete'],
} as const;

const featureParamDef = legacyRelationshipSchemas['renote-mute/delete'].input;

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('relationshipCommands', commands => createContractTransportEndpoint(meta, paramDef, relationshipContract['renote-mute/delete'], async (params, user) => commands['renote-mute/delete'](params, {
	context: { actor: user },
})));
