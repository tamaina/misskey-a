/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import * as os from 'node:os';
import { MoreThan } from 'typeorm';
import { createInstanceRouter } from './api.router.js';
import type { InstanceApiDependencies, ReadEndpoints } from './api.dependencies.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { loadSystemInformation } from '../../statistics/backend/runtime-dependencies/systeminformation.js';
import { USER_ONLINE_THRESHOLD } from '../../users/backend/presence-constants.js';
import { IdService } from '../../runtime/backend/services/IdService.js';
import { QueryService } from '../../notes/backend/services/QueryService.js';
import { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import { MetaService } from './services/MetaService.js';
import { MetaEntityService } from './serializers/MetaEntityService.js';
import { SystemAccountService } from '../../users/backend/services/SystemAccountService.js';
import { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
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
