/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { antennasRemoveNoteContract, antennasRemoveNoteErrors } from './remove-note.contract.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { FanoutTimelineService } from '../../services/FanoutTimelineService.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface AntennasRemoveNoteDependencies {
	antennasRepository: AntennasRepository;
	fanoutTimelineService: FanoutTimelineService;
}
export function createAntennasRemoveNoteProcedure<Actor extends MiLocalUser>(deps: AntennasRemoveNoteDependencies) {
	return createApiProcedure<Actor>()(antennasRemoveNoteContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const antenna = await deps.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});
			if (antenna == null) {
				throw apiError(antennasRemoveNoteErrors.noSuchAntenna);
			}
			await deps.fanoutTimelineService.remove(`antennaTimeline:${antenna.id}`, ps.noteId);
		});
}
