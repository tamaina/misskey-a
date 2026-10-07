/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { operationsContract } from '../../../../contract/index.js';
import { legacyOperationsSchemas } from '@features/operations/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const;

export const paramDef = legacyOperationsSchemas['admin/queue/clear'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('operations', operations => createContractTransportEndpoint(meta, paramDef, operationsContract['admin/queue/clear'], async (params, user) => operations['admin/queue/clear'](params, {
	context: { actor: { id: user.id } },
})));
