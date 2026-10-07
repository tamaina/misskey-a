/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { portabilityImportContract } from '../../../contract/imports.js';
import ms from '@/runtime-dependencies/ms.js';
import { portabilityImportErrors } from '@features/portability/contract';
import { legacyPortabilityImportSchemas } from '@features/portability/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

const featureMeta = {
	secure: true,
	requireCredential: true,
	requiredRolePolicy: 'canImportMuting',
	prohibitMoved: true,
	limit: { duration: ms('1hour'), max: 1 },
	errors: portabilityImportErrors['i/import-muting'],
} as const;

const featureParamDef = legacyPortabilityImportSchemas['i/import-muting'].input;

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('portabilityImportCommands', commands => createContractTransportEndpoint(meta, paramDef, portabilityImportContract['i/import-muting'], async (params, user) => commands['i/import-muting'](params, {
	context: { actor: user },
})));
