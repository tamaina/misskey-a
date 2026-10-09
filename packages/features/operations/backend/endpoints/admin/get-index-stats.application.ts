/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminGetIndexStatsInput, adminGetIndexStatsOutput } from './get-index-stats.contract.js';

@Injectable()
export class AdminGetIndexStatsApplicationService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {}

	public async execute(_ps: v.InferOutput<typeof adminGetIndexStatsInput>, _me: MiUser): Promise<v.InferOutput<typeof adminGetIndexStatsOutput>> {
		const result = await (async () => {
			const stats = await this.db.query<unknown>('SELECT * FROM pg_indexes;');

			return stats;
		})();
		return v.parse(adminGetIndexStatsOutput, result);
	}
}
