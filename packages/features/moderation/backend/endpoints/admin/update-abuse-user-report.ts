/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandsContract } from '../../../contract/index.js';
import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = moderationCommandMeta['admin/update-abuse-user-report'];
const paramDefFromFeature = legacyModerationCommandSchemas['admin/update-abuse-user-report'].input;

export const paramDef = paramDefFromFeature as Schema;
const route = 'admin/update-abuse-user-report' as const;
export const { feature, createEndpoint } = defineFeatureEndpoint('moderationCommands', commands => createContractTransportEndpoint(meta, paramDefFromFeature as Schema, moderationCommandsContract['admin/update-abuse-user-report'], async (params, user) => commands[route](params, {
	context: { actor: user },
})));
