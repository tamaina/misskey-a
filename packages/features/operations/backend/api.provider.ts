/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { DataSource } from 'typeorm';
import { QueueService } from './../../runtime/backend/services/QueueService.js';
import { ModerationLogService } from './../../moderation/backend/services/ModerationLogService.js';
import type { DeliverQueue, InboxQueue, DbQueue, ObjectStorageQueue } from './../../boot/backend/assembly/QueueModule.js';
import type * as Redis from 'ioredis';
import { LoggerService } from './../../runtime/backend/services/LoggerService.js';
import { MetaService } from './../../instance/backend/services/MetaService.js';
import { GlobalEventService } from './../../runtime/backend/services/GlobalEventService.js';
import { createOperationsRouter } from './router.js';
type OperationsRouter = ReturnType<typeof createOperationsRouter<MiLocalUser>>;
/** Compose once at root registration, after all domain initialization hooks. */
@Injectable()
export class OperationsApiProvider {
	private router: OperationsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): OperationsRouter {
		if (this.router !== undefined) return this.router;
		this.router = createOperationsRouter<MiLocalUser>({
			db: this.moduleRef.get<DataSource>(DI.db, { strict: false }),
			queueService: this.moduleRef.get(QueueService, { strict: false }),
			moderationLogService: this.moduleRef.get(ModerationLogService, { strict: false }),
			deliverQueue: this.moduleRef.get<DeliverQueue>('queue:deliver', { strict: false }),
			inboxQueue: this.moduleRef.get<InboxQueue>('queue:inbox', { strict: false }),
			dbQueue: this.moduleRef.get<DbQueue>('queue:db', { strict: false }),
			objectStorageQueue: this.moduleRef.get<ObjectStorageQueue>('queue:objectStorage', { strict: false }),
			redisClient: this.moduleRef.get<Redis.Redis>(DI.redis, { strict: false }),
			loggerService: this.moduleRef.get(LoggerService, { strict: false }),
			metaService: this.moduleRef.get(MetaService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
		});
		return this.router;
	}
}
