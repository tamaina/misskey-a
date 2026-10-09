/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import type { DataSource } from 'typeorm';
import type { Config } from '@/config.js';
import type { AdsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiMeta } from './models/Meta.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { MetaService } from './services/MetaService.js';
import { MetaEntityService } from './serializers/MetaEntityService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { Redis } from 'ioredis';
import { implement } from '@orpc/server';
import { instanceApiContract } from './api.definition.js';
import { createInstanceRouter as createServerInfoRouter } from './endpoints/server-info.js';
import { createAdCreateProcedure } from './endpoints/admin/ad/create.js';
import { createAdDeleteProcedure } from './endpoints/admin/ad/delete.js';
import { createAdListProcedure } from './endpoints/admin/ad/list.js';
import { createAdUpdateProcedure } from './endpoints/admin/ad/update.js';
import { createAdminMetaProcedure } from './endpoints/admin/meta.js';
import { createAdminServerInfoProcedure } from './endpoints/admin/server-info.js';
import { createUpdateMetaProcedure } from './endpoints/admin/update-meta.js';
import { createEndpointProcedure } from './endpoints/endpoint.js';
import { createEndpointsProcedure } from './endpoints/endpoints.js';
import { createOnlineUsersCountProcedure, createOnlineUsersCountGetProcedure } from './endpoints/get-online-users-count.js';
import { createMetaProcedure } from './endpoints/meta.js';
import { createPingProcedure } from './endpoints/ping.js';
import { createPinnedUsersProcedure } from './endpoints/pinned-users.js';
import type { ApiContext, ApiActor } from '@features/api/backend/transport/context.js';
import type { ServerInfoDependencies } from './server-info.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { MoreThan } from 'typeorm';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { loadSystemInformation } from '@features/statistics/backend/runtime-dependencies/systeminformation.js';
import { USER_ONLINE_THRESHOLD } from '@features/users/backend/presence-constants.js';

export interface OnlineUsersCountDependencies {
	thresholdMs: number;
	countSince(cutoff: Date): Promise<number>;
}

export interface EndpointDescriptor {
	name: string;
	properties: Readonly<Record<string, { type?: string }>>;
}

export type ReadEndpoints = () => Promise<readonly EndpointDescriptor[]>;

export interface InstanceApiDependencies {
	adsRepository: AdsRepository;
	usersRepository: UsersRepository;
	serverSettings: MiMeta;
	config: Config;
	idService: Pick<IdService, 'gen'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	metaService: Pick<MetaService, 'fetch' | 'update'>;
	metaEntityService: Pick<MetaEntityService, 'pack' | 'packDetailed'>;
	systemAccountService: Pick<SystemAccountService, 'fetch'>;
	userEntityService: Pick<UserEntityService, 'packMany'>;
	db: Pick<DataSource, 'query'>;
	redisClient: Pick<Redis, 'info'>;
	getOnlineUsersCount: OnlineUsersCountDependencies;
	readEndpoints: ReadEndpoints;
	now?: () => number;
}

export function createInstanceRouter<Actor extends ApiActor>(deps: InstanceApiDependencies & { serverInfo: ServerInfoDependencies }) {
	return implement(instanceApiContract).$context<ApiContext<Actor>>().router({
		...createServerInfoRouter<Actor>(deps.serverInfo),
		adCreate: createAdCreateProcedure<Actor>(deps),
		adDelete: createAdDeleteProcedure<Actor>(deps),
		adList: createAdListProcedure<Actor>(deps),
		adUpdate: createAdUpdateProcedure<Actor>(deps),
		adminMeta: createAdminMetaProcedure<Actor>(deps),
		adminServerInfo: createAdminServerInfoProcedure<Actor>(deps),
		updateMeta: createUpdateMetaProcedure<Actor>(deps),
		endpoint: createEndpointProcedure<Actor>(deps),
		endpoints: createEndpointsProcedure<Actor>(deps),
		onlineUsersCount: createOnlineUsersCountProcedure<Actor>(deps),
		onlineUsersCountGet: createOnlineUsersCountGetProcedure<Actor>(deps),
		meta: createMetaProcedure<Actor>(deps),
		ping: createPingProcedure<Actor>(deps),
		pinnedUsers: createPinnedUsersProcedure<Actor>(deps),
	});
}

@Injectable()
export class InstanceApiProvider {
	private router: ReturnType<typeof createInstanceRouter<MiLocalUser>> | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(readEndpoints: ReadEndpoints) {
		if (this.router !== undefined) return this.router;
		const users = this.moduleRef.get<InstanceApiDependencies['usersRepository']>(DI.usersRepository, { strict: false });
		const settings = this.moduleRef.get<InstanceApiDependencies['serverSettings']>(DI.meta, { strict: false });
		this.router = createInstanceRouter<MiLocalUser>({
			adsRepository: this.moduleRef.get<InstanceApiDependencies['adsRepository']>(DI.adsRepository, { strict: false }),
			usersRepository: this.moduleRef.get<InstanceApiDependencies['usersRepository']>(DI.usersRepository, { strict: false }),
			serverSettings: this.moduleRef.get<InstanceApiDependencies['serverSettings']>(DI.meta, { strict: false }),
			config: this.moduleRef.get<InstanceApiDependencies['config']>(DI.config, { strict: false }),
			db: this.moduleRef.get<InstanceApiDependencies['db']>(DI.db, { strict: false }),
			redisClient: this.moduleRef.get<InstanceApiDependencies['redisClient']>(DI.redis, { strict: false }),
			idService: this.moduleRef.get<InstanceApiDependencies['idService']>(IdService, { strict: false }),
			queryService: this.moduleRef.get<InstanceApiDependencies['queryService']>(QueryService, { strict: false }),
			moderationLogService: this.moduleRef.get<InstanceApiDependencies['moderationLogService']>(ModerationLogService, { strict: false }),
			metaService: this.moduleRef.get<InstanceApiDependencies['metaService']>(MetaService, { strict: false }),
			metaEntityService: this.moduleRef.get<InstanceApiDependencies['metaEntityService']>(MetaEntityService, { strict: false }),
			systemAccountService: this.moduleRef.get<InstanceApiDependencies['systemAccountService']>(SystemAccountService, { strict: false }),
			userEntityService: this.moduleRef.get<InstanceApiDependencies['userEntityService']>(UserEntityService, { strict: false }),
			readEndpoints,
			getOnlineUsersCount: { thresholdMs: USER_ONLINE_THRESHOLD, countSince: cutoff => users.countBy({ lastActiveDate: MoreThan(cutoff) }) },
			serverInfo: { enabled: () => settings.enableServerMachineStats, read: async () => { const si = await loadSystemInformation(); const memory = await si.mem(); const disks = await si.fsSize(); return { machine: os.hostname(), cpu: { model: os.cpus()[0].model, cores: os.cpus().length }, mem: { total: memory.total }, fs: { total: disks[0].size, used: disks[0].used } }; } },
		});
		return this.router;
	}
}
