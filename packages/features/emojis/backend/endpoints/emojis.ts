/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { emojisContract } from '../../contract/index.js';
import { legacyEmojisSchemas } from '@features/emojis/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['meta'],
	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,
	res: legacyEmojisSchemas.output as Schema,
} as const;

export const paramDef = legacyEmojisSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('emojis', emojis => createContractTransportEndpoint(meta, paramDef, emojisContract['emojis'], async params => emojis.emojis(params)));
