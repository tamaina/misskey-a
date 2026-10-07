/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandsContract } from '../../../contract/index.js';
import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = moderationCommandMeta['admin/suspend-user'];
const paramDefFromFeature = legacyModerationCommandSchemas['admin/suspend-user'].input;

export const paramDef = paramDefFromFeature as Schema;
const route = 'admin/suspend-user' as const;
export const { feature, createEndpoint } = defineFeatureEndpoint('moderationCommands', commands => createContractTransportEndpoint(meta, paramDefFromFeature as Schema, moderationCommandsContract['admin/suspend-user'], async (params, user) => commands[route](params, {
	context: { actor: user },
})));
