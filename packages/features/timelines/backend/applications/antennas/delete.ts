/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { type antennasDeleteContract, antennasDeleteErrors } from '../../endpoints/antennas/delete.contract.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';

@Injectable()
export class AntennasDeleteApplicationService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof antennasDeleteContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const antenna = await this.antennasRepository.findOneBy({
			id: ps.antennaId,
			userId: me.id,
		});

		if (antenna == null) {
			throw apiError(antennasDeleteErrors.noSuchAntenna);
		}

		await this.antennasRepository.delete(antenna.id);

		this.globalEventService.publishInternalEvent('antennaDeleted', antenna);
	}
}
