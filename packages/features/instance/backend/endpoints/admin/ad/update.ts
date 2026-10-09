/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { adUpdateContract } from './update.contract.js';
import type { InstanceApiDependencies } from '../../../api.implementation.js';
export type AdUpdateDependencies = Pick<InstanceApiDependencies, 'adsRepository' | 'moderationLogService'>;
export function createAdUpdateProcedure<Actor extends ApiActor>(deps: AdUpdateDependencies) {
	return createApiProcedure<Actor>()(adUpdateContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const ad = await deps.adsRepository.findOneBy({ id: ps.id });
			if (ad == null) throw apiError({ code: 'NO_SUCH_AD', message: 'No such ad.', id: 'b7aa1727-1354-47bc-a182-3a9c3973d300' });
			await deps.adsRepository.update(ad.id, {
				url: ps.url,
				place: ps.place,
				priority: ps.priority,
				ratio: ps.ratio,
				memo: ps.memo,
				imageUrl: ps.imageUrl,
				expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : undefined,
				startsAt: ps.startsAt ? new Date(ps.startsAt) : undefined,
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
			});
			const updatedAd = await deps.adsRepository.findOneByOrFail({ id: ad.id });
			deps.moderationLogService.log(me, 'updateAd', {
				adId: ad.id,
				before: ad,
				after: updatedAd,
			});
		});
}
