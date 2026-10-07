/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { webhookContract } from '../../../../contract/index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { webhookErrors } from '@features/integrations/contract';
import { legacyWebhookSchemas } from '@features/integrations/backend';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'write:account',

	errors: webhookErrors['i/webhooks/delete'],
} as const;

export const paramDef = legacyWebhookSchemas['i/webhooks/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('webhookCommands', commands => createContractTransportEndpoint(meta, paramDef, webhookContract['i/webhooks/delete'], async (params, user) => commands['i/webhooks/delete'](params, {
	context: { actor: user },
})));
