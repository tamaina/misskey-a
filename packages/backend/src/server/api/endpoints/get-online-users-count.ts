/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyOnlineUsersCountSchemas } from '@features/instance/backend';
import type { InstanceFeature } from '@features/instance/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,
	res: legacyOnlineUsersCountSchemas.output as Schema,
} as const;

export const paramDef = legacyOnlineUsersCountSchemas.input as Schema;

export const feature = 'instance' as const;
export function createEndpoint(instance: InstanceFeature) {
	return new Endpoint(meta, paramDef, async params => instance['get-online-users-count'](params));
}
