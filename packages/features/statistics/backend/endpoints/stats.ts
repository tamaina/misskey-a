/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { statisticsContract } from '../../contract/index.js';
import { legacyStatsSchemas } from '@features/statistics/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	requireCredential: false,
	tags: ['meta'],
	res: legacyStatsSchemas.output as Schema,
} as const;

export const paramDef = legacyStatsSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('statistics', statistics => createContractTransportEndpoint(meta, paramDef, statisticsContract['stats'], async params => statistics.stats(params)));
