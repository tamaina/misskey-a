/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import { DI } from '@/di-symbols.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { bindThis } from '@/decorators.js';
import { acquireChartInsertLock } from '@features/runtime/backend/cache/distributed-lock.js';
import Chart from './core.js';
import { ChartLoggerService } from '@features/statistics/backend/services/ChartLoggerService.js';
import { name, schema } from './definitions/per-user-notes.js';
import type { KVs } from './core.js';

/**
 * ユーザーごとのノートに関するチャート
 */
@Injectable()
export default class PerUserNotesChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [count] = await Promise.all([
			this.notesRepository.countBy({ userId: group }),
		]);

		return {
			total: count,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public update(user: { id: MiUser['id'] }, note: MiNote, isAdditional: boolean): void {
		this.commit({
			'total': isAdditional ? 1 : -1,
			'inc': isAdditional ? 1 : 0,
			'dec': isAdditional ? 0 : 1,
			'diffs.normal': note.replyId == null && note.renoteId == null ? (isAdditional ? 1 : -1) : 0,
			'diffs.renote': note.renoteId != null ? (isAdditional ? 1 : -1) : 0,
			'diffs.reply': note.replyId != null ? (isAdditional ? 1 : -1) : 0,
			'diffs.withFile': note.fileIds.length > 0 ? (isAdditional ? 1 : -1) : 0,
		}, user.id);
	}
}

export { PerUserNotesChart };
