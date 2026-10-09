/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as os from 'node:os';
import * as v from 'valibot';
import { loadSystemInformation } from '../../../../statistics/backend/runtime-dependencies/systeminformation.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { adminServerInfoContract } from './server-info.contract.js';
import type { InstanceApiDependencies } from '../../api.dependencies.js';
export type AdminServerInfoDependencies = Pick<InstanceApiDependencies, 'redisClient' | 'db'>;
export function createAdminServerInfoProcedure<Actor extends ApiActor>(deps: AdminServerInfoDependencies) {
	return implement(adminServerInfoContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/server-info', requireCredential: true, requireModerator: true, kind: 'read:admin:server-info' }))
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
