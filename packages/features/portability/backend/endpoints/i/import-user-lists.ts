/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { portabilityImportContract } from '../../../contract/imports.js';
import ms from 'ms';
import { portabilityImportErrors } from '@features/portability/contract';
import { legacyPortabilityImportSchemas } from '@features/portability/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

const featureMeta = {
	secure: true,
	requireCredential: true,
	requiredRolePolicy: 'canImportUserLists',
	prohibitMoved: true,
	limit: { duration: ms('1hour'), max: 1 },
	errors: portabilityImportErrors['i/import-user-lists'],
} as const;

const featureParamDef = legacyPortabilityImportSchemas['i/import-user-lists'].input;

export const meta = featureMeta;
export const paramDef = featureParamDef as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('portabilityImportCommands', commands => createContractTransportEndpoint(meta, paramDef, portabilityImportContract['i/import-user-lists'], async (params, user) => commands['i/import-user-lists'](params, {
	context: { actor: user },
})));
