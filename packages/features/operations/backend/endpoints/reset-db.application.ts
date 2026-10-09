/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { LoggerService } from '../../../runtime/backend/services/LoggerService.js';
import { DI } from '@/di-symbols.js';
import { resetDb } from '../utility/reset-db.js';
import { MetaService } from '../../../instance/backend/services/MetaService.js';
import { GlobalEventService } from '../../../runtime/backend/services/GlobalEventService.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import * as v from 'valibot';
import { resetDbInput, resetDbOutput } from './reset-db.contract.js';

@Injectable()
export class ResetDbApplicationService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private loggerService: LoggerService,
		private metaService: MetaService,
		private globalEventService: GlobalEventService,
	) {}

	public async execute(_ps: v.InferOutput<typeof resetDbInput>, _me: MiUser | null): Promise<v.InferOutput<typeof resetDbOutput>> {
		const result = await (async () => {
			if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV is not a test');

			const logger = this.loggerService.getLogger('reset-db');
			logger.info('---- Resetting database...');

			await this.redisClient.flushdb();
			await resetDb(this.db);

			// DIコンテナで管理しているmetaのインスタンスには上記のリセット処理が届かないため、
			// 初期値を流して明示的にリフレッシュする
			const meta = await this.metaService.fetch(true);
			this.globalEventService.publishInternalEvent('metaUpdated', { after: meta });

			logger.info('---- Database reset complete.');

			await new Promise(resolve => setTimeout(resolve, 1000));
		})();
		return v.parse(resetDbOutput, result);
	}
}
