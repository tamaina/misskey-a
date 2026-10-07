/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../../contract/index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['notes', 'drafts'],
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:account',
	errors: notesCommandErrors['notes/drafts/delete'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/drafts/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	createContractTransportEndpoint(meta, paramDef, notesCommandsContract['notes/drafts/delete'], async (params, user) => commands['notes/drafts/delete'](params, { context: { actor: user } })));
