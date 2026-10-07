/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationsContract } from '../../../contract/index.js';
import { legacyNotificationsSchemas } from '@features/notifications/backend';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',
} as const;

export const paramDef = legacyNotificationsSchemas['notifications/flush'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notifications', notifications => createContractTransportEndpoint(meta, paramDef, notificationsContract['notifications/flush'], async (params, user) =>
	notifications['notifications/flush'](params, { context: { actor: { id: user.id }, token: null } })));
