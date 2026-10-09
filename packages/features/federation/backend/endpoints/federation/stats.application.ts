/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In, IsNull, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, InstancesRepository } from '../../../../persistence/backend/repositories/models.js';
import { awaitAll } from '../../../../runtime/backend/async/await-all.js';
import { InstanceEntityService } from '../../../../instance/backend/serializers/InstanceEntityService.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { FederationStatsInput, FederationStatsOutput } from './stats.contract.js';
import { federationStatsContract } from './stats.contract.js';

@Injectable()
export class FederationStatsApplicationService {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private instanceEntityService: InstanceEntityService,
	) {}

	public async execute(ps: FederationStatsInput, me: MiUser | null): Promise<FederationStatsOutput> {
		const result = await (async () => {
			const [topSubInstances, topPubInstances, allSubCount, allPubCount] = await Promise.all([
				this.getTopInstances('followeeHost', 'followersCount', ps.limit),
				this.getTopInstances('followerHost', 'followingCount', ps.limit),
				this.followingsRepository.count({
					where: {
						followeeHost: Not(IsNull()),
						isFollowerSuspended: false,
					},
				}),
				this.followingsRepository.count({
					where: {
						followerHost: Not(IsNull()),
						isFollowerSuspended: false,
					},
				}),
			]);

			const [gotSubCount, gotPubCount] = await Promise.all([
				this.followingsRepository.count({
					where: {
						followeeHost: In(topSubInstances.map(x => x.host)),
						isFollowerSuspended: false,
					},
				}),
				this.followingsRepository.count({
					where: {
						followerHost: In(topPubInstances.map(x => x.host)),
						isFollowerSuspended: false,
					},
				}),
			]);

			return await awaitAll({
				topSubInstances: this.instanceEntityService.packMany(topSubInstances, me),
				otherFollowersCount: Math.max(0, allSubCount - gotSubCount),
				topPubInstances: this.instanceEntityService.packMany(topPubInstances, me),
				otherFollowingCount: Math.max(0, allPubCount - gotPubCount),
			});
		})();
		return v.parse(federationStatsContract['~orpc'].outputSchema!, result);
	}

	private async getTopInstances(hostColumn: 'followeeHost' | 'followerHost', countColumn: 'followersCount' | 'followingCount', limit: number) {
		const counts = await this.followingsRepository.createQueryBuilder('following')
			.select(`following.${hostColumn}`, 'host')
			.addSelect('COUNT(*)', 'count')
			.innerJoin(this.instancesRepository.metadata.tablePath, 'instance', `instance.host = following.${hostColumn}`)
			.where('following.isFollowerSuspended = false')
			.groupBy(`following.${hostColumn}`)
			.orderBy('COUNT(*)', 'DESC')
			.addOrderBy(`following.${hostColumn}`, 'ASC')
			.limit(limit)
			.getRawMany<{ host: string; count: string }>();
		const instances = await this.instancesRepository.findBy({ host: In(counts.map(x => x.host)) });
		return counts.flatMap(({ host, count }) => {
			const instance = instances.find(x => x.host === host);
			return instance ? [{ ...instance, [countColumn]: Number(count) }] : [];
		});
	}
}
