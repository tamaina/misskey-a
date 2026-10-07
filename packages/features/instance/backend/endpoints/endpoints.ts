/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instanceContract } from '../../contract/index.js';
import { legacyEndpointsSchemas } from '@features/instance/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['meta'],
	requireCredential: false,
	res: legacyEndpointsSchemas.output as Schema,
} as const;

export const paramDef = legacyEndpointsSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('instance', instance => createContractTransportEndpoint(meta, paramDef, instanceContract['endpoints'], async params => instance.endpoints(params)));
