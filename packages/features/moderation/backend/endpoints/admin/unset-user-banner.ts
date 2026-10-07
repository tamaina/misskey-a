/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandsContract } from '../../../contract/index.js';
import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = moderationCommandMeta['admin/unset-user-banner'];
const paramDefFromFeature = legacyModerationCommandSchemas['admin/unset-user-banner'].input;

export const paramDef = paramDefFromFeature as Schema;
const route = 'admin/unset-user-banner' as const;
export const { feature, createEndpoint } = defineFeatureEndpoint('moderationCommands', commands => createContractTransportEndpoint(meta, paramDefFromFeature as Schema, moderationCommandsContract['admin/unset-user-banner'], async (params, user) => commands[route](params, {
	context: { actor: user },
})));
