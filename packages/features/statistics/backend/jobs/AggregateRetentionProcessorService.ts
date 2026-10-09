/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { RetentionAggregationsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { deepClone } from '@features/runtime/backend/data/clone.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { isDuplicateKeyValueError } from '@features/persistence/backend/utility/is-duplicate-key-value-error.js';
import { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class AggregateRetentionProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.retentionAggregationsRepository)
		private retentionAggregationsRepository: RetentionAggregationsRepository,

		private idService: IdService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('aggregate-retention');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Aggregating retention...');

		const now = new Date();
		const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

		// 過去(だいたい)30日分のレコードを取得
		const pastRecords = await this.retentionAggregationsRepository.findBy({
			createdAt: MoreThan(new Date(Date.now() - (1000 * 60 * 60 * 24 * 31))),
		});

		// 今日登録したユーザーを全て取得
		const targetUsers = await this.usersRepository.findBy({
			host: IsNull(),
			id: MoreThan(this.idService.gen(Date.now() - (1000 * 60 * 60 * 24))),
		});
		const targetUserIds = targetUsers.map(u => u.id);

		try {
			await this.retentionAggregationsRepository.insert({
				id: this.idService.gen(),
				createdAt: now,
				updatedAt: now,
				dateKey,
				userIds: targetUserIds,
				usersCount: targetUserIds.length,
			});
		} catch (err) {
			if (isDuplicateKeyValueError(err)) {
				this.logger.succ('Skip because it has already been processed by another worker.');
				return;
			}
			throw err;
		}

		// 今日活動したユーザーを全て取得
		const activeUsers = await this.usersRepository.findBy({
			host: IsNull(),
			lastActiveDate: MoreThan(new Date(Date.now() - (1000 * 60 * 60 * 24))),
		});
		const activeUsersIds = activeUsers.map(u => u.id);

		for (const record of pastRecords) {
			const retention = record.userIds.filter(id => activeUsersIds.includes(id)).length;

			const data = deepClone(record.data);
			data[dateKey] = retention;

			this.retentionAggregationsRepository.update(record.id, {
				updatedAt: now,
				data,
			});
		}

		this.logger.succ('Retention aggregated.');
	}
}
