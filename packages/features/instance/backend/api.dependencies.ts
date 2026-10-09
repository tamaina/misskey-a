/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { DataSource } from 'typeorm';
import type { Config } from '@/config.js';
import type { AdsRepository, UsersRepository } from '../../persistence/backend/repositories/models.js';
import type { MiMeta } from './models/Meta.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { MetaService } from './services/MetaService.js';
import type { MetaEntityService } from './serializers/MetaEntityService.js';
import type { SystemAccountService } from '../../users/backend/services/SystemAccountService.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { Redis } from 'ioredis';
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
