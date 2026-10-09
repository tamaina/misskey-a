/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { adDeleteContract } from './delete.contract.js';
import type { InstanceApiDependencies } from '../../../api.implementation.js';
export type AdDeleteDependencies = Pick<InstanceApiDependencies, 'adsRepository' | 'moderationLogService'>;
export function createAdDeleteProcedure<Actor extends ApiActor>(deps: AdDeleteDependencies) {
	return createApiProcedure<Actor>()(adDeleteContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const ad = await deps.adsRepository.findOneBy({ id: ps.id });
			if (ad == null) throw apiError({ code: 'NO_SUCH_AD', message: 'No such ad.', id: 'ccac9863-3a03-416e-b899-8a64041118b1' });
			await deps.adsRepository.delete(ad.id);
			deps.moderationLogService.log(me, 'deleteAd', {
				adId: ad.id,
				ad: ad,
			});
		});
}
