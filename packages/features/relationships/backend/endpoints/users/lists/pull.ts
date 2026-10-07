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
	tags: ['lists', 'users'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	description: 'Remove a user from a list.',

	errors: listErrors['users/lists/pull'],
} as const;

export const paramDef = legacyListSchemas['users/lists/pull'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('listCommands', commands => createContractTransportEndpoint(meta, paramDef, listContract['users/lists/pull'], async (params, user) => commands['users/lists/pull'](params, {
	context: { actor: user },
})));
