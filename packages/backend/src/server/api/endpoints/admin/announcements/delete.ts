/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { announcementCommandErrors } from '@features/announcements/contract';
import { legacyAnnouncementCommandSchemas } from '@features/announcements/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:announcements',

	errors: announcementCommandErrors['admin/announcements/delete'],
} as const;

export const paramDef = legacyAnnouncementCommandSchemas['admin/announcements/delete'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('announcementCommands', commands => new Endpoint(meta, paramDef, async (params, user) => commands['admin/announcements/delete'](params, {
	context: { actor: user },
})));
