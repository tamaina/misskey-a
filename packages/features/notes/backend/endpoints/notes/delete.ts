/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../contract/index.js';
import type { Schema } from '@/misc/json-schema.js';
import ms from '@/runtime-dependencies/ms.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['notes'],
	requireCredential: true,
	kind: 'write:notes',
	limit: { duration: ms('1hour'), max: 300, minInterval: ms('1sec') },
	errors: notesCommandErrors['notes/delete'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	createContractTransportEndpoint(meta, paramDef, notesCommandsContract['notes/delete'], async (params, user) => commands['notes/delete'](params, { context: { actor: user } })));
