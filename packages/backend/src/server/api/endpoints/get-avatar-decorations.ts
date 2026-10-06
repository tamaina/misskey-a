/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyAvatarDecorationSchemas } from '@features/avatar-decorations/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['users'],
	requireCredential: false,
	res: legacyAvatarDecorationSchemas.output as Schema,
} as const;

export const paramDef = legacyAvatarDecorationSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('avatarDecorations', decorations => new Endpoint(meta, paramDef, async (params, user) => decorations['get-avatar-decorations'](params, {
	context: { authenticated: user != null },
})));
