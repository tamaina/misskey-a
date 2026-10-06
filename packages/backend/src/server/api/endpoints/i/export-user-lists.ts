/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { legacyPortabilitySchemas } from '@features/portability/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1min'),
		max: 1,
	},
} as const;

export const paramDef = legacyPortabilitySchemas['i/export-user-lists'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('portability', portability => new Endpoint(meta, paramDef, async (params, user) => portability['i/export-user-lists'](params, {
	context: { actor: { id: user.id } },
})));
