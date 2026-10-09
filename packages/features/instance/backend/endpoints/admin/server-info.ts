/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import * as os from 'node:os';
import * as v from 'valibot';
import { loadSystemInformation } from '@features/statistics/backend/runtime-dependencies/systeminformation.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { adminServerInfoContract } from './server-info.contract.js';
import type { InstanceApiDependencies } from '../../api.implementation.js';
export type AdminServerInfoDependencies = Pick<InstanceApiDependencies, 'redisClient' | 'db'>;
export function createAdminServerInfoProcedure<Actor extends ApiActor>(deps: AdminServerInfoDependencies) {
	return createApiProcedure<Actor>()(adminServerInfoContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const si = await loadSystemInformation();
			const memStats = await si.mem();
			const fsStats = await si.fsSize();
			const netInterface = await si.networkInterfaceDefault();
			const redisServerInfo = await deps.redisClient.info('Server');
			const m = redisServerInfo.match(new RegExp('^redis_version:(.*)', 'm'));
			const redis_version = m?.[1];
			return {
				machine: os.hostname(),
				os: os.platform(),
				node: process.version,
				psql: v.parse(v.array(v.object({ server_version: v.string() })), await deps.db.query<unknown>('SHOW server_version'))[0].server_version,
				...(redis_version === undefined ? {} : { redis: redis_version }),
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
