/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { resetDbContract } from './reset-db.contract.js';
import type { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import type { LoggerService } from '../../../runtime/backend/services/LoggerService.js';
import { resetDb } from '../utility/reset-db.js';
import type { MetaService } from '../../../instance/backend/services/MetaService.js';
import type { GlobalEventService } from '../../../runtime/backend/services/GlobalEventService.js';
export interface ResetDbDependencies {
	db: DataSource;
	redisClient: Pick<Redis.Redis, 'flushdb'>;
	loggerService: Pick<LoggerService, 'getLogger'>;
	metaService: Pick<MetaService, 'fetch'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
export function createResetDbProcedure<Actor extends ApiActor>(deps: ResetDbDependencies) {
	return createApiProcedure<Actor>()(resetDbContract)
		.handler(async () => {
			const result = await (async () => {
				if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV is not a test');
				const logger = deps.loggerService.getLogger('reset-db');
				logger.info('---- Resetting database...');
				await deps.redisClient.flushdb();
				await resetDb(deps.db);
				// DIコンテナで管理しているmetaのインスタンスには上記のリセット処理が届かないため、
				// 初期値を流して明示的にリフレッシュする
				const meta = await deps.metaService.fetch(true);
				deps.globalEventService.publishInternalEvent('metaUpdated', { after: meta });
				logger.info('---- Database reset complete.');
				await new Promise(resolve => setTimeout(resolve, 1000));
			})();
			return result;
		});
}
