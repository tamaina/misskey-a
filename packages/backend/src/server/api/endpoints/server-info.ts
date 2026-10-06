/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import { createServerInfo, legacyServerInfoSchemas } from '@misskey-a/instance/backend';
import type { Schema } from '@/misc/json-schema.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	tags: ['meta'],
	res: legacyServerInfoSchemas.output as Schema,
} as const;

export const paramDef = legacyServerInfoSchemas.input as Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		serverSettings: MiMeta,
	) {
		const serverInfo = createServerInfo({
			enabled: () => serverSettings.enableServerMachineStats,
			read: async () => {
				const si = await import('systeminformation');

				const memStats = await si.mem();
				const fsStats = await si.fsSize();

				return {
					machine: os.hostname(),
					cpu: {
						model: os.cpus()[0].model,
						cores: os.cpus().length,
					},
					mem: {
						total: memStats.total,
					},
					fs: {
						total: fsStats[0].size,
						used: fsStats[0].used,
					},
				};
			},
		});
		super(meta, paramDef, async params => serverInfo(params));
	}
}
