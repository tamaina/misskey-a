/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedAntenna } from '@features/timelines/backend/antenna.schema.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { antennasListContract } from './list.contract.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface AntennasListDependencies {
	antennasRepository: AntennasRepository;
	antennaEntityService: AntennaEntityService;
}
export function createAntennasListProcedure<Actor extends MiLocalUser>(deps: AntennasListDependencies) {
	return createApiProcedure<Actor>()(antennasListContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const me = context.principal;
				const antennas = await deps.antennasRepository.findBy({
					userId: me.id,
				});
				return await Promise.all(antennas.map(x => deps.antennaEntityService.pack(x)));
			})();
			return result.map(toPackedAntenna);
		});
}
