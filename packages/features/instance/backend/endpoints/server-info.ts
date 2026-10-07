/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instanceContract } from '../../contract/index.js';
import { legacyServerInfoSchemas } from '@features/instance/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	tags: ['meta'],
	res: legacyServerInfoSchemas.output as Schema,
} as const;

export const paramDef = legacyServerInfoSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('instance', instance => createContractTransportEndpoint(meta, paramDef, instanceContract['server-info'], async params => instance['server-info'](params)));
