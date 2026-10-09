/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { adListContract } from './list.contract.js';
import type { InstanceApiDependencies } from '../../../api.dependencies.js';
export type AdListDependencies = Pick<InstanceApiDependencies, 'queryService' | 'adsRepository'>;
export function createAdListProcedure<Actor extends ApiActor>(deps: AdListDependencies) {
	return implement(adListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/ad/list', requireCredential: true, requireModerator: true, kind: 'read:admin:ad' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const query = deps.queryService.makePaginationQuery(deps.adsRepository.createQueryBuilder('ad'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			if (ps.publishing === true) {
				query.andWhere('ad.expiresAt > :now', { now: new Date() }).andWhere('ad.startsAt <= :now', { now: new Date() });
			} else if (ps.publishing === false) {
				query.andWhere('ad.expiresAt <= :now', { now: new Date() }).orWhere('ad.startsAt > :now', { now: new Date() });
			}
			const ads = await query.limit(ps.limit).getMany();
			return ads.map(ad => ({
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				memo: ad.memo,
				place: ad.place,
				priority: ad.priority,
				ratio: ad.ratio,
			}));
		});
}
