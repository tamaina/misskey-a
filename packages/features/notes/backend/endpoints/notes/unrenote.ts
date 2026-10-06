/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyNotesCommandSchemas } from '../../commands.js';
import { notesCommandErrors } from '../../../contract/index.js';
import type { Schema } from '@/misc/json-schema.js';
import ms from '@/runtime-dependencies/ms.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['notes'],
	requireCredential: true,
	kind: 'write:notes',
	limit: { duration: ms('1hour'), max: 300, minInterval: ms('1sec') },
	errors: notesCommandErrors['notes/unrenote'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/unrenote'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	new Endpoint(meta, paramDef, async (params, user) => commands['notes/unrenote'](params, { context: { actor: user } })));
