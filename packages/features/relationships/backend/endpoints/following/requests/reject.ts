/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { relationshipContract } from '../../../../contract/commands.js';
import { relationshipErrors } from '@features/relationships/contract';
import { legacyRelationshipSchemas } from '@features/relationships/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

const featureMeta = {
	tags: ['following', 'account'],
	requireCredential: true,
	kind: 'write:following',
	errors: relationshipErrors['following/requests/reject'],
} as const;

const featureParamDef = legacyRelationshipSchemas['following/requests/reject'].input;

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('relationshipCommands', commands => createContractTransportEndpoint(meta, paramDef, relationshipContract['following/requests/reject'], async (params, user) => commands['following/requests/reject'](params, {
	context: { actor: user },
})));
