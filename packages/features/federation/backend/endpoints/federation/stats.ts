/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFederationStatsDefinition, packedFederationStatsInput, packedFederationStatsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { In, IsNull, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, InstancesRepository } from '@/models/_.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';

import { InstanceEntityService } from '@features/instance/backend/serializers/InstanceEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFederationStatsDefinition);

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60 * 60,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFederationStatsInput, typeof packedFederationStatsOutput> {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private instanceEntityService: InstanceEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
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
		});
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
