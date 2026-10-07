/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DI } from '@/di-symbols.js';
import type { RepositorySet } from '@features/persistence/backend/repositories/factory.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import type { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import type { SystemWebhookEntityService } from '@features/integrations/backend/serializers/SystemWebhookEntityService.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import type { Config } from '@/config.js';
import type * as Redis from 'ioredis';
import type { DataSource } from 'typeorm';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { Port, PortToken } from './service-definitions.js';

/** Audited legacy bridge: property names agree with RepositorySet providers. */
function repositoryPorts(ids: { [K in keyof RepositorySet]: symbol }) {
	return Object.fromEntries(Object.entries(ids).map(([name, token]) => [name, Object.freeze({ kind: 'port', name, token })])) as {
		[K in keyof RepositorySet]: Port<K, RepositorySet[K]>
	};
}

function legacyPort<Name extends string, Value>(name: Name, token = Symbol(name)): Port<Name, Value> {
	return Object.freeze({ kind: 'port', name, token: token as PortToken<Value> });
}

export const ports = {
	...repositoryPorts(DI),
	userEntityService: legacyPort<'userEntityService', UserEntityService>('userEntityService'),
	noteEntityService: legacyPort<'noteEntityService', NoteEntityService>('noteEntityService'),
	driveFileEntityService: legacyPort<'driveFileEntityService', DriveFileEntityService>('driveFileEntityService'),
	idService: legacyPort<'idService', IdService>('idService'),
	globalEventService: legacyPort<'globalEventService', GlobalEventService>('globalEventService'),
	moderationLogService: legacyPort<'moderationLogService', ModerationLogService>('moderationLogService'),
	roleService: legacyPort<'roleService', RoleService>('roleService'),
	queryService: legacyPort<'queryService', QueryService>('queryService'),
	utilityService: legacyPort<'utilityService', UtilityService>('utilityService'),
	systemAccountService: legacyPort<'systemAccountService', SystemAccountService>('systemAccountService'),
	systemWebhookEntityService: legacyPort<'systemWebhookEntityService', SystemWebhookEntityService>('systemWebhookEntityService'),
	httpRequestService: legacyPort<'httpRequestService', HttpRequestService>('httpRequestService'),
	loggerService: legacyPort<'loggerService', LoggerService>('loggerService'),
	redisClient: legacyPort<'redisClient', Redis.Redis>('redisClient', DI.redis),
	config: legacyPort<'config', Config>('config', DI.config),
	db: legacyPort<'db', DataSource>('db', DI.db),
	meta: legacyPort<'meta', MiMeta>('meta', DI.meta),
};
