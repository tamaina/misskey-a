/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../../contract/index.js';
import type { Schema } from '@/misc/json-schema.js';
import ms from '@/runtime-dependencies/ms.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['reactions', 'notes'],
	requireCredential: true,
	kind: 'write:reactions',
	limit: { duration: ms('1hour'), max: 60, minInterval: ms('3sec') },
	errors: notesCommandErrors['notes/reactions/delete'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/reactions/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	createContractTransportEndpoint(meta, paramDef, notesCommandsContract['notes/reactions/delete'], async (params, user) => commands['notes/reactions/delete'](params, { context: { actor: user } })));
