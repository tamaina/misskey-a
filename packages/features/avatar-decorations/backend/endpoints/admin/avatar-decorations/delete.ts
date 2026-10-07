/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { avatarDecorationCommandsContract } from '../../../../contract/index.js';
import { legacyAvatarDecorationCommandSchemas } from '@features/avatar-decorations/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',
	errors: {},
} as const;

export const paramDef = legacyAvatarDecorationCommandSchemas['admin/avatar-decorations/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('avatarDecorationCommands', commands => createContractTransportEndpoint(meta, paramDef, avatarDecorationCommandsContract['admin/avatar-decorations/delete'], async (params, user) => commands['admin/avatar-decorations/delete'](params, {
	context: { actor: user },
})));
