/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { announcementCommandsContract } from '../../../contract/index.js';
import { legacyAnnouncementCommandSchemas } from '@features/announcements/backend';
import type { Schema } from '@/misc/json-schema.js';
import { createContractTransportEndpoint } from '@/server/api/contract-transport-endpoint.js';
import { defineFeatureEndpoint } from '@/server/api/feature-endpoint.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: {},
} as const;

export const paramDef = legacyAnnouncementCommandSchemas['i/read-announcement'].input as Schema;

export const { feature, createEndpoint } = defineFeatureEndpoint('announcementCommands', commands => createContractTransportEndpoint(meta, paramDef, announcementCommandsContract['i/read-announcement'], async (params, user) => commands['i/read-announcement'](params, {
	context: { actor: user },
})));
