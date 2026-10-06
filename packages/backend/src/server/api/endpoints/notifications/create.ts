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

	errors: {
	},
} as const;

export const paramDef = legacyNotificationsSchemas['notifications/create'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notifications', notifications => new Endpoint(meta, paramDef, async (params, user, token) =>
	notifications['notifications/create'](params, {
		context: {
			actor: { id: user.id },
			token: token == null ? null : { id: token.id, name: token.name, iconUrl: token.iconUrl },
		},
	})));
