/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasRemoveNoteContract, antennasRemoveNoteErrors } from './remove-note.contract.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { FanoutTimelineService } from '../../services/FanoutTimelineService.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AntennasRemoveNoteDependencies {
	antennasRepository: AntennasRepository;
	fanoutTimelineService: FanoutTimelineService;
}
export function createAntennasRemoveNoteProcedure<Actor extends MiLocalUser>(deps: AntennasRemoveNoteDependencies) {
	return implement(antennasRemoveNoteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: antennasRemoveNoteContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account', prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
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
