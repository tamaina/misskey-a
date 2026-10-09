/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { federationInstancesContract } from './instances.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import type { InstancesRepository } from '../../../../persistence/backend/repositories/models.js';
import type { InstanceEntityService } from '../../../../instance/backend/serializers/InstanceEntityService.js';
import type { MetaService } from '../../../../instance/backend/services/MetaService.js';
import { sqlLikeEscape } from '../../../../persistence/backend/utility/sql-like-escape.js';
import * as v from 'valibot';
export interface FederationInstancesDependencies {
	instancesRepository: Pick<InstancesRepository, 'createQueryBuilder'>;
	instanceEntityService: Pick<InstanceEntityService, 'packMany'>;
	metaService: Pick<MetaService, 'fetch'>;
}
export function createFederationInstancesProcedure<Actor extends ApiActor>(deps: FederationInstancesDependencies) {
	return implement(federationInstancesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: federationInstancesContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const query = deps.instancesRepository.createQueryBuilder('instance');
				switch (ps.sort) {
					case '+pubSub': query.orderBy('instance.followingCount', 'DESC').orderBy('instance.followersCount', 'DESC'); break;
					case '-pubSub': query.orderBy('instance.followingCount', 'ASC').orderBy('instance.followersCount', 'ASC'); break;
					case '+notes': query.orderBy('instance.notesCount', 'DESC'); break;
					case '-notes': query.orderBy('instance.notesCount', 'ASC'); break;
					case '+users': query.orderBy('instance.usersCount', 'DESC'); break;
					case '-users': query.orderBy('instance.usersCount', 'ASC'); break;
					case '+following': query.orderBy('instance.followingCount', 'DESC'); break;
					case '-following': query.orderBy('instance.followingCount', 'ASC'); break;
					case '+followers': query.orderBy('instance.followersCount', 'DESC'); break;
					case '-followers': query.orderBy('instance.followersCount', 'ASC'); break;
					case '+firstRetrievedAt': query.orderBy('instance.firstRetrievedAt', 'DESC'); break;
					case '-firstRetrievedAt': query.orderBy('instance.firstRetrievedAt', 'ASC'); break;
					case '+latestRequestReceivedAt': query.orderBy('instance.latestRequestReceivedAt', 'DESC', 'NULLS LAST'); break;
					case '-latestRequestReceivedAt': query.orderBy('instance.latestRequestReceivedAt', 'ASC', 'NULLS FIRST'); break;
					default: query.orderBy('instance.id', 'DESC'); break;
				}
				if (typeof ps.blocked === 'boolean') {
					const meta = await deps.metaService.fetch(true);
					if (ps.blocked) {
						query.andWhere(meta.blockedHosts.length === 0 ? '1=0' : 'instance.host IN (:...blocks)', { blocks: meta.blockedHosts });
					} else {
						query.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'instance.host NOT IN (:...blocks)', { blocks: meta.blockedHosts });
					}
				}
				if (typeof ps.notResponding === 'boolean') {
					if (ps.notResponding) {
						query.andWhere('instance.isNotResponding = TRUE');
					} else {
						query.andWhere('instance.isNotResponding = FALSE');
					}
				}
				if (typeof ps.suspended === 'boolean') {
					if (ps.suspended) {
						query.andWhere('instance.suspensionState != \'none\'');
					} else {
						query.andWhere('instance.suspensionState = \'none\'');
					}
				}
				if (typeof ps.silenced === 'boolean') {
					const meta = await deps.metaService.fetch(true);
					if (ps.silenced) {
						if (meta.silencedHosts.length === 0) {
							return [];
						}
						query.andWhere('instance.host IN (:...silences)', {
							silences: meta.silencedHosts,
						});
					} else if (meta.silencedHosts.length > 0) {
						query.andWhere('instance.host NOT IN (:...silences)', {
							silences: meta.silencedHosts,
						});
					}
				}
				if (typeof ps.federating === 'boolean') {
					if (ps.federating) {
						query.andWhere('((instance.followingCount > 0) OR (instance.followersCount > 0))');
					} else {
						query.andWhere('((instance.followingCount = 0) AND (instance.followersCount = 0))');
					}
				}
				if (typeof ps.subscribing === 'boolean') {
					if (ps.subscribing) {
						query.andWhere('instance.followersCount > 0');
					} else {
						query.andWhere('instance.followersCount = 0');
					}
				}
				if (typeof ps.publishing === 'boolean') {
					if (ps.publishing) {
						query.andWhere('instance.followingCount > 0');
					} else {
						query.andWhere('instance.followingCount = 0');
					}
				}
				if (ps.host) {
					query.andWhere('instance.host like :host', { host: '%' + sqlLikeEscape(ps.host.toLowerCase()) + '%' });
				}
				const instances = await query.limit(ps.limit).offset(ps.offset).getMany();
				return await deps.instanceEntityService.packMany(instances, me);
			})();
			return v.parse(federationInstancesContract['~orpc'].outputSchema!, result);
		});
}
