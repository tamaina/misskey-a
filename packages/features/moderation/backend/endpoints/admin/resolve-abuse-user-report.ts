/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandsContract } from '../../../contract/index.js';
import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = moderationCommandMeta['admin/resolve-abuse-user-report'];
const paramDefFromFeature = legacyModerationCommandSchemas['admin/resolve-abuse-user-report'].input;

export const paramDef = paramDefFromFeature as Schema;
const route = 'admin/resolve-abuse-user-report' as const;
export const { feature, createEndpoint } = defineFeatureEndpoint('moderationCommands', commands => createContractTransportEndpoint(meta, paramDefFromFeature as Schema, moderationCommandsContract['admin/resolve-abuse-user-report'], async (params, user) => commands[route](params, {
	context: { actor: user },
})));
