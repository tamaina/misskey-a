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
	tags: ['notes'],
	requireCredential: true,
	kind: 'write:account',
	limit: { duration: ms('1hour'), max: 10 },
	errors: notesCommandErrors['notes/thread-muting/create'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/thread-muting/create'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	createContractTransportEndpoint(meta, paramDef, notesCommandsContract['notes/thread-muting/create'], async (params, user) => commands['notes/thread-muting/create'](params, { context: { actor: user } })));
