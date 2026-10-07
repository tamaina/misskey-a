/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { avatarDecorationCommandsContract } from '../../../../contract/index.js';
import { legacyAvatarDecorationCommandSchemas } from '@features/avatar-decorations/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	errors: {},
} as const;

export const paramDef = legacyAvatarDecorationCommandSchemas['admin/avatar-decorations/update'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('avatarDecorationCommands', commands => createContractTransportEndpoint(meta, paramDef, avatarDecorationCommandsContract['admin/avatar-decorations/update'], async (params, user) => commands['admin/avatar-decorations/update'](params, {
	context: { actor: user },
})));
