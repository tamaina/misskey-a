/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyOperationsSchemas } from '@features/operations/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const;

export const paramDef = legacyOperationsSchemas['admin/queue/retry-job'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('operations', operations => new Endpoint(meta, paramDef, async (params, user) => operations['admin/queue/retry-job'](params, {
	context: { actor: { id: user.id } },
})));
