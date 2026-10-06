/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyServerInfoSchemas } from '@features/instance/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	tags: ['meta'],
	res: legacyServerInfoSchemas.output as Schema,
} as const;

export const paramDef = legacyServerInfoSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('instance', instance => new Endpoint(meta, paramDef, async params => instance['server-info'](params)));
