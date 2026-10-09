/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminGetIndexStatsInput, AdminGetIndexStatsOutput } from './get-index-stats.contract.js';
import { adminGetIndexStatsContract } from './get-index-stats.contract.js';

@Injectable()
export class AdminGetIndexStatsApplicationService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {}

	public async execute(_ps: AdminGetIndexStatsInput, _me: MiUser): Promise<AdminGetIndexStatsOutput> {
		const result = await (async () => {
			const stats = await this.db.query<unknown>('SELECT * FROM pg_indexes;');

			return stats;
		})();
		return v.parse(adminGetIndexStatsContract['~orpc'].outputSchema!, result);
	}
}
