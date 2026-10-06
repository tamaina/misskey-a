/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { webhookErrors } from '@features/integrations/contract';
import { legacyWebhookSchemas } from '@features/integrations/backend';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'write:account',

	errors: webhookErrors['i/webhooks/delete'],
} as const;

export const paramDef = legacyWebhookSchemas['i/webhooks/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('webhookCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['i/webhooks/delete'](params, {
	context: { actor: user },
})));
