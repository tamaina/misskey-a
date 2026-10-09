/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toFederationInstance } from '../../federation.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { federationStatsContract } from './stats.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { In, IsNull, Not } from 'typeorm';
import type { FollowingsRepository, InstancesRepository } from '../../../../persistence/backend/repositories/models.js';
import { awaitAll } from '../../../../runtime/backend/async/await-all.js';
import type { InstanceEntityService } from '../../../../instance/backend/serializers/InstanceEntityService.js';
export interface FederationStatsDependencies {
	instancesRepository: Pick<InstancesRepository, 'metadata' | 'findBy'>;
	followingsRepository: Pick<FollowingsRepository, 'count' | 'createQueryBuilder'>;
	instanceEntityService: Pick<InstanceEntityService, 'packMany'>;
}
export function createFederationStatsProcedure<Actor extends ApiActor>(deps: FederationStatsDependencies) {
	async function getTopInstances(hostColumn: 'followeeHost' | 'followerHost', countColumn: 'followersCount' | 'followingCount', limit: number) {
		const counts = await deps.followingsRepository.createQueryBuilder('following')
			.select(`following.${hostColumn}`, 'host')
			.addSelect('COUNT(*)', 'count')
			.innerJoin(deps.instancesRepository.metadata.tablePath, 'instance', `instance.host = following.${hostColumn}`)
			.where('following.isFollowerSuspended = false')
			.groupBy(`following.${hostColumn}`)
			.orderBy('COUNT(*)', 'DESC')
			.addOrderBy(`following.${hostColumn}`, 'ASC')
			.limit(limit)
			.getRawMany<{ host: string; count: string }>();
		const instances = await deps.instancesRepository.findBy({ host: In(counts.map(x => x.host)) });
		return counts.flatMap(({ host, count }) => {
			const instance = instances.find(x => x.host === host);
			return instance ? [{ ...instance, [countColumn]: Number(count) }] : [];
		});
	}

	return createApiProcedure<Actor>()(federationStatsContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const [topSubInstances, topPubInstances, allSubCount, allPubCount] = await Promise.all([
					getTopInstances('followeeHost', 'followersCount', ps.limit),
					getTopInstances('followerHost', 'followingCount', ps.limit),
					deps.followingsRepository.count({
						where: {
							followeeHost: Not(IsNull()),
							isFollowerSuspended: false,
						},
					}),
					deps.followingsRepository.count({
						where: {
							followerHost: Not(IsNull()),
							isFollowerSuspended: false,
						},
					}),
				]);
				const [gotSubCount, gotPubCount] = await Promise.all([
					deps.followingsRepository.count({
						where: {
							followeeHost: In(topSubInstances.map(x => x.host)),
							isFollowerSuspended: false,
						},
					}),
					deps.followingsRepository.count({
						where: {
							followerHost: In(topPubInstances.map(x => x.host)),
							isFollowerSuspended: false,
						},
					}),
				]);
				return await awaitAll({
					topSubInstances: deps.instanceEntityService.packMany(topSubInstances, me).then(instances => instances.map(toFederationInstance)),
					otherFollowersCount: Math.max(0, allSubCount - gotSubCount),
					topPubInstances: deps.instanceEntityService.packMany(topPubInstances, me).then(instances => instances.map(toFederationInstance)),
					otherFollowingCount: Math.max(0, allPubCount - gotPubCount),
				});
			})();
			return result;
		});
}
