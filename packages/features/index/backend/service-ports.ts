/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DI } from '../../../backend/src/di-symbols.js';
import type { RepositorySet } from '../../../backend/src/models/repository-factory.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { NoteEntityService } from '../../notes/backend/serializers/NoteEntityService.js';
import type { DriveFileEntityService } from '../../drive/backend/serializers/DriveFileEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { GlobalEventService } from '../../runtime/backend/services/GlobalEventService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { QueryService } from '../../../backend/src/core/QueryService.js';
import type { UtilityService } from '../../../backend/src/core/UtilityService.js';
import type { SystemAccountService } from '../../users/backend/services/SystemAccountService.js';
import type { SystemWebhookEntityService } from '../../integrations/backend/serializers/SystemWebhookEntityService.js';
import type { HttpRequestService } from '../../runtime/backend/services/HttpRequestService.js';
import type { LoggerService } from '../../runtime/backend/services/LoggerService.js';
import type { Config } from '../../../backend/src/config.js';
import type * as Redis from 'ioredis';
import type { DataSource } from 'typeorm';
import type { MiMeta } from '../../../backend/src/models/_.js';
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
