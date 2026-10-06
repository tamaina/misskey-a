/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotificationsSchemas } from '@features/notifications/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',
} as const;

export const paramDef = legacyNotificationsSchemas['notifications/mark-all-as-read'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notifications', notifications => new Endpoint(meta, paramDef, async (params, user) =>
	notifications['notifications/mark-all-as-read'](params, { context: { actor: { id: user.id }, token: null } })));
