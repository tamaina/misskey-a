/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { portabilityContract } from '../../../contract/index.js';
import ms from '@/runtime-dependencies/ms.js';
import { legacyPortabilitySchemas } from '@features/portability/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1day'),
		max: 1,
	},
} as const;

export const paramDef = legacyPortabilitySchemas['i/export-notes'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('portability', portability => createContractTransportEndpoint(meta, paramDef, portabilityContract['i/export-notes'], async (params, user) => portability['i/export-notes'](params, {
	context: { actor: { id: user.id } },
})));
