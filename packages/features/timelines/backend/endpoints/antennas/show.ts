/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasShowContract, antennasShowErrors } from './show.contract.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AntennasShowDependencies {
	antennasRepository: AntennasRepository;
	antennaEntityService: AntennaEntityService;
}
export function createAntennasShowProcedure<Actor extends MiLocalUser>(deps: AntennasShowDependencies) {
	return implement(antennasShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: antennasShowContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			// Fetch the antenna
			const antenna = await deps.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});
			if (antenna == null) {
				throw apiError(antennasShowErrors.noSuchAntenna);
			}
			return await deps.antennaEntityService.pack(antenna);
		});
}
