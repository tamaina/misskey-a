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
	tags: ['reactions', 'notes'],
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:reactions',
	errors: notesCommandErrors['notes/reactions/create'],
} as const;

export const paramDef = legacyNotesCommandSchemas['notes/reactions/create'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('notesCommands', commands =>
	new Endpoint(meta, paramDef, async (params, user) => commands['notes/reactions/create'](params, { context: { actor: user } })));
