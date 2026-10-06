/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { relationshipErrors } from '@features/relationships/contract';
import { legacyRelationshipSchemas } from '@features/relationships/backend';

export const meta = {
	tags: ['account'],
	requireCredential: true,
	kind: 'write:mutes',
	errors: relationshipErrors['renote-mute/delete'],
} as const;

export const paramDef = legacyRelationshipSchemas['renote-mute/delete'].input;
