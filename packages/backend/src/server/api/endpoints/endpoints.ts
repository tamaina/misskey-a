/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyEndpointsSchemas } from '@features/instance/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['meta'],
	requireCredential: false,
	res: legacyEndpointsSchemas.output as Schema,
} as const;

export const paramDef = legacyEndpointsSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('instance', instance => new Endpoint(meta, paramDef, async params => instance.endpoints(params)));
