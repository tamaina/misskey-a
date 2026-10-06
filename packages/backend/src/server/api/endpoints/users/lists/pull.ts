/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { listErrors } from '@features/relationships/contract';
import { legacyListSchemas } from '@features/relationships/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['lists', 'users'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	description: 'Remove a user from a list.',

	errors: listErrors['users/lists/pull'],
} as const;

export const paramDef = legacyListSchemas['users/lists/pull'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('listCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['users/lists/pull'](params, {
	context: { actor: user },
})));
