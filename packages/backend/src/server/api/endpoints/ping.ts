/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPing, legacyPingSchemas } from '@misskey-a/instance/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

// Retain the existing transport/auth/error pipeline while migrating the implementation.
export const meta = {
	requireCredential: false,
	tags: ['meta'],
	res: legacyPingSchemas.output as Schema,
} as const;
export const paramDef = legacyPingSchemas.input as Schema;

export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor() {
		const ping = createPing();
		super(meta, paramDef, async params => ping(params));
	}
}
