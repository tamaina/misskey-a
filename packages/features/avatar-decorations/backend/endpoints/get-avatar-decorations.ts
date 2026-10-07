/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { avatarDecorationsContract } from '../../contract/index.js';
import { legacyAvatarDecorationSchemas } from '@features/avatar-decorations/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['users'],
	requireCredential: false,
	res: legacyAvatarDecorationSchemas.output as Schema,
} as const;

export const paramDef = legacyAvatarDecorationSchemas.input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('avatarDecorations', decorations => createContractTransportEndpoint(meta, paramDef, avatarDecorationsContract['get-avatar-decorations'], async (params, user) => decorations['get-avatar-decorations'](params, {
	context: { authenticated: user != null },
})));
