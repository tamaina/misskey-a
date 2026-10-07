/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { operationsContract } from '../../../../contract/index.js';
import { legacyOperationsSchemas } from '@features/operations/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const;

export const paramDef = legacyOperationsSchemas['admin/queue/resume'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('operations', operations => createContractTransportEndpoint(meta, paramDef, operationsContract['admin/queue/resume'], async (params, user) => operations['admin/queue/resume'](params, {
	context: { actor: { id: user.id } },
})));
