/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { adDeleteContract } from './delete.contract.js';
import type { InstanceApiDependencies } from '../../../api.dependencies.js';
export type AdDeleteDependencies = Pick<InstanceApiDependencies, 'adsRepository' | 'moderationLogService'>;
export function createAdDeleteProcedure<Actor extends ApiActor>(deps: AdDeleteDependencies) {
	return implement(adDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/ad/delete', requireCredential: true, requireModerator: true, kind: 'write:admin:ad' }))
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
