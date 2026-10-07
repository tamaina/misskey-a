/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../contract/index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['notes'],
	requireCredential: true,
	kind: 'write:account',
	errors: notesCommandErrors['promo/read'],
} as const;

export const paramDef = legacyNotesCommandSchemas['promo/read'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	createContractTransportEndpoint(meta, paramDef, notesCommandsContract['promo/read'], async (params, user) => commands['promo/read'](params, { context: { actor: user } })));
