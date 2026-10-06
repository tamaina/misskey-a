/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../../commands.js';
import { notesCommandErrors } from '../../../../contract/index.js';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['notes'],
	requireCredential: true,
	kind: 'write:account',
	errors: notesCommandErrors['notes/thread-muting/delete'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/thread-muting/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	new Endpoint(meta, paramDef, async (params, user) => commands['notes/thread-muting/delete'](params, { context: { actor: user } })));
