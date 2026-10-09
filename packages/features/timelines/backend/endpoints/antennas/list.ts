/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasListContract } from './list.contract.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AntennasListDependencies {
	antennasRepository: AntennasRepository;
	antennaEntityService: AntennaEntityService;
}
export function createAntennasListProcedure<Actor extends MiLocalUser>(deps: AntennasListDependencies) {
	return implement(antennasListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: antennasListContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const antennas = await deps.antennasRepository.findBy({
				userId: me.id,
			});
			return await Promise.all(antennas.map(x => deps.antennaEntityService.pack(x)));
		});
}
