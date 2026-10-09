/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import { antennasShowInput, antennasShowErrors } from '../../endpoints/antennas/show.contract.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';

@Injectable()
export class AntennasShowApplicationService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private antennaEntityService: AntennaEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof antennasShowInput>, me: MiLocalUser) {
		// Fetch the antenna
		const antenna = await this.antennasRepository.findOneBy({
			id: ps.antennaId,
			userId: me.id,
		});

		if (antenna == null) {
			throw apiError(antennasShowErrors.noSuchAntenna);
		}

		return await this.antennaEntityService.pack(antenna);
	}
}
