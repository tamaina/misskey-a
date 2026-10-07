/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../../contract/index.js';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

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
