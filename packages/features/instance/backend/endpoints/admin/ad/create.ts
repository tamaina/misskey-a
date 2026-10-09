/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { adCreateContract } from './create.contract.js';
import type { InstanceApiDependencies } from '../../../api.dependencies.js';
export type AdCreateDependencies = Pick<InstanceApiDependencies, 'adsRepository' | 'idService' | 'moderationLogService'>;
export function createAdCreateProcedure<Actor extends ApiActor>(deps: AdCreateDependencies) {
	return implement(adCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/ad/create', requireCredential: true, requireModerator: true, kind: 'write:admin:ad' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const ad = await deps.adsRepository.insertOne({
				id: deps.idService.gen(),
				expiresAt: new Date(ps.expiresAt),
				startsAt: new Date(ps.startsAt),
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
				url: ps.url,
				imageUrl: ps.imageUrl,
				priority: ps.priority,
				ratio: ps.ratio,
				place: ps.place,
				memo: ps.memo,
			});
			deps.moderationLogService.log(me, 'createAd', {
				adId: ad.id,
				ad: ad,
			});
			return {
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				priority: ad.priority,
				ratio: ad.ratio,
				place: ad.place,
				memo: ad.memo,
			};
		});
}
