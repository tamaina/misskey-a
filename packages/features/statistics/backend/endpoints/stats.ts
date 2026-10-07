/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { statisticsContract } from '../../contract/index.js';
import { legacyStatsSchemas } from '@features/statistics/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	requireCredential: false,
	tags: ['meta'],
	res: legacyStatsSchemas.output as Schema,
} as const;

export const paramDef = legacyStatsSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('statistics', statistics => createContractTransportEndpoint(meta, paramDef, statisticsContract['stats'], async params => statistics.stats(params)));
