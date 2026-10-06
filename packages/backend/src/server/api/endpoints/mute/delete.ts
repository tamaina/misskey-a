/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meta as featureMeta, paramDef as featureParamDef } from '../../../../../../features/relationships/backend/endpoints/mute/delete.js';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('relationshipCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['mute/delete'](params, {
	context: { actor: user },
})));
