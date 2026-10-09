/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasDeleteContract, antennasDeleteErrors } from './delete.contract.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AntennasDeleteDependencies {
	antennasRepository: AntennasRepository;
	globalEventService: GlobalEventService;
}
export function createAntennasDeleteProcedure<Actor extends MiLocalUser>(deps: AntennasDeleteDependencies) {
	return implement(antennasDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: antennasDeleteContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const antenna = await deps.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});
			if (antenna == null) {
				throw apiError(antennasDeleteErrors.noSuchAntenna);
			}
			await deps.antennasRepository.delete(antenna.id);
			deps.globalEventService.publishInternalEvent('antennaDeleted', antenna);
		});
}
