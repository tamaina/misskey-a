/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidResetDbDefinition, voidResetDbInput, voidResetDbOutput } from '../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { LoggerService } from '../../../runtime/backend/services/LoggerService.js';

import { DI } from '@/di-symbols.js';
import { resetDb } from '@/misc/reset-db.js';
import { MetaService } from '../../../instance/backend/services/MetaService.js';
import { GlobalEventService } from '../../../runtime/backend/services/GlobalEventService.js';

const contractProjection = projectEndpointContract(voidResetDbDefinition);

export const meta = {
	tags: ['non-productive'],

	requireCredential: false,

	description: 'Only available when running with <code>NODE_ENV=testing</code>. Reset the database and flush Redis.',

	errors: {

	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidResetDbInput, typeof voidResetDbOutput> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private loggerService: LoggerService,
		private metaService: MetaService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
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
		});
	}
}
