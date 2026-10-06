/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyAvatarDecorationCommandSchemas } from '@features/avatar-decorations/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	errors: {},
} as const;

export const paramDef = legacyAvatarDecorationCommandSchemas['admin/avatar-decorations/update'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('avatarDecorationCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['admin/avatar-decorations/update'](params, {
	context: { actor: user },
})));
