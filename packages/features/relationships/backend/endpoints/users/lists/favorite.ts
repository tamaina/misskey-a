/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { listContract } from '../../../../contract/lists.js';
import { listErrors } from '@features/relationships/contract';
import { legacyListSchemas } from '@features/relationships/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	requireCredential: true,
	kind: 'write:account',
	errors: listErrors['users/lists/favorite'],
} as const;

export const paramDef = legacyListSchemas['users/lists/favorite'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('listCommands', commands => createContractTransportEndpoint(meta, paramDef, listContract['users/lists/favorite'], async (params, user) => commands['users/lists/favorite'](params, {
	context: { actor: user },
})));
