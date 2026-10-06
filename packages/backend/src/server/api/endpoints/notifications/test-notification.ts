/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotificationsSchemas } from '@features/notifications/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['notifications'],

	requireCredential: true,

	kind: 'write:notifications',

	limit: {
		duration: 1000 * 60,
		max: 10,
	},
} as const;

export const paramDef = legacyNotificationsSchemas['notifications/test-notification'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notifications', notifications => new Endpoint(meta, paramDef, async (params, user) =>
	notifications['notifications/test-notification'](params, { context: { actor: { id: user.id }, token: null } })));
