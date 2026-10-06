/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from '@/runtime-dependencies/ms.js';
import { relationshipErrors } from '@features/relationships/contract';
import { legacyRelationshipSchemas } from '@features/relationships/backend';

export const meta = {
	tags: ['account'],
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:mutes',
	limit: { duration: ms('1hour'), max: 20 },
	errors: relationshipErrors['renote-mute/create'],
} as const;

export const paramDef = legacyRelationshipSchemas['renote-mute/create'].input;
