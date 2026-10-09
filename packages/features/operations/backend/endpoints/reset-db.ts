/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { resetDbContract } from './reset-db.contract.js';
import type { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import type { LoggerService } from '../../../runtime/backend/services/LoggerService.js';
import { resetDb } from '../utility/reset-db.js';
import type { MetaService } from '../../../instance/backend/services/MetaService.js';
import type { GlobalEventService } from '../../../runtime/backend/services/GlobalEventService.js';
import * as v from 'valibot';
export interface ResetDbDependencies {
	db: DataSource;
	redisClient: Pick<Redis.Redis, 'flushdb'>;
	loggerService: Pick<LoggerService, 'getLogger'>;
	metaService: Pick<MetaService, 'fetch'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
export function createResetDbProcedure<Actor extends ApiActor>(deps: ResetDbDependencies) {
	return implement(resetDbContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: resetDbContract['~orpc'].meta.requestName }))
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
			return v.parse(resetDbContract['~orpc'].outputSchema!, result);
		});
}
