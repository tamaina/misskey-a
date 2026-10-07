/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { portabilityContract } from '../../../contract/index.js';
import ms from '@/runtime-dependencies/ms.js';
import { legacyPortabilitySchemas } from '@features/portability/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},
} as const;

export const paramDef = legacyPortabilitySchemas['i/export-antennas'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('portability', portability => createContractTransportEndpoint(meta, paramDef, portabilityContract['i/export-antennas'], async (params, user) => portability['i/export-antennas'](params, {
	context: { actor: { id: user.id } },
})));
