/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineAdminServerInfoDefinition, inlineAdminServerInfoInput, inlineAdminServerInfoOutput } from '../../../contract/endpoint-definitions.js';
import { loadSystemInformation } from '@/runtime-dependencies/systeminformation.js';
import * as os from 'node:os';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';

import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(inlineAdminServerInfoDefinition);

export const meta = {
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:server-info',

	tags: ['admin', 'meta'],

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminServerInfoInput, typeof inlineAdminServerInfoOutput> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

	) {
		super(meta, contractProjection, async () => {
			const si = await loadSystemInformation();

			const memStats = await si.mem();
			const fsStats = await si.fsSize();
			const netInterface = await si.networkInterfaceDefault();

			const redisServerInfo = await this.redisClient.info('Server');
			const m = redisServerInfo.match(new RegExp('^redis_version:(.*)', 'm'));
			const redis_version = m?.[1];

			return {
				machine: os.hostname(),
				os: os.platform(),
				node: process.version,
				psql: await this.db.query('SHOW server_version').then(x => x[0].server_version),
				redis: redis_version,
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
				net: {
					interface: netInterface,
				},
			};
		});
	}
}
