/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meta as featureMeta, paramDef as featureParamDef } from '../../../../../../features/portability/backend/endpoints/i/import-antennas.js';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('portabilityImportCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['i/import-antennas'](params, {
	context: { actor: user },
})));

// QueueService uses this legacy endpoint type for the import queue payload.
export type { Antenna } from '@features/portability/backend';
