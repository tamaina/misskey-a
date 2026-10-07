/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../../contract/index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import ms from '@/runtime-dependencies/ms.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

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
