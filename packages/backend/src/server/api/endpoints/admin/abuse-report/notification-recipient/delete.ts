/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meta, paramDef as paramDefFromFeature } from '../../../../../../../../features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/delete.js';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export { meta };
export const paramDef = paramDefFromFeature as Schema;
const route = 'admin/abuse-report/notification-recipient/delete' as const;
export const { feature, createEndpoint } = defineFeatureEndpoint('moderationCommands', commands => new Endpoint(meta, paramDefFromFeature as Schema, async (params, user) => commands[route](params, {
	context: { actor: user },
})));
