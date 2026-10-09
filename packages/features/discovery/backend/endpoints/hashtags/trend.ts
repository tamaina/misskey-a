/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { FeaturedService } from '../../services/FeaturedService.js';
import { HashtagService } from '../../services/HashtagService.js';
import type { DiscoveryInputs } from '../discovery.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class HashtagsTrendOperation {
	constructor(
		private featuredService: FeaturedService,
		private hashtagService: HashtagService,
	) {
	}

	async execute(_ps: DiscoveryInputs['hashtags/trend'], _me: MiLocalUser | null) {
		const ranking = await this.featuredService.getHashtagsRanking(10);

		const charts = ranking.length === 0 ? {} : await this.hashtagService.getCharts(ranking, 20);

		const stats = ranking.map(tag => ({
			tag,
			chart: charts[tag],
			usersCount: Math.max(...charts[tag]),
		}));

		return stats;
	}
}
