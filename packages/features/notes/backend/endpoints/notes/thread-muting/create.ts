/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../../commands.js';
import { notesCommandErrors, notesCommandsContract } from '../../../../contract/index.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import ms from 'ms';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@features/api/backend/transport/feature-endpoint.js';

export const meta = {
	tags: ['notes'],
	requireCredential: true,
	kind: 'write:account',
	limit: { duration: ms('1hour'), max: 10 },
	errors: notesCommandErrors['notes/thread-muting/create'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/thread-muting/create'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	createContractTransportEndpoint(meta, paramDef, notesCommandsContract['notes/thread-muting/create'], async (params, user) => commands['notes/thread-muting/create'](params, { context: { actor: user } })));
