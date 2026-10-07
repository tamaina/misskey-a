/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instanceContract } from '../../contract/index.js';
import { legacyPingSchemas } from '@features/instance/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

// Retain the existing transport/auth/error pipeline while migrating the implementation.
export const meta = {
	requireCredential: false,
	tags: ['meta'],
	res: legacyPingSchemas.output as Schema,
} as const;
export const paramDef = legacyPingSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('instance', instance => createContractTransportEndpoint(meta, paramDef, instanceContract['ping'], async params => instance.ping(params)));
