/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { FanoutTimelineService } from '../../services/FanoutTimelineService.js';
import { type antennasRemoveNoteContract, antennasRemoveNoteErrors } from '../../endpoints/antennas/remove-note.contract.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';

@Injectable()
export class AntennasRemoveNoteApplicationService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private fanoutTimelineService: FanoutTimelineService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof antennasRemoveNoteContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const antenna = await this.antennasRepository.findOneBy({
			id: ps.antennaId,
			userId: me.id,
		});

		if (antenna == null) {
			throw apiError(antennasRemoveNoteErrors.noSuchAntenna);
		}

		await this.fanoutTimelineService.remove(`antennaTimeline:${antenna.id}`, ps.noteId);
	}
}
