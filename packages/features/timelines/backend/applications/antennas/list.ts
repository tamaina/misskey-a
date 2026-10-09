/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import { antennasListInput } from '../../endpoints/antennas/list.contract.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';

@Injectable()
export class AntennasListApplicationService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private antennaEntityService: AntennaEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof antennasListInput>, me: MiLocalUser) {
		const antennas = await this.antennasRepository.findBy({
			userId: me.id,
		});

		return await Promise.all(antennas.map(x => this.antennaEntityService.pack(x)));
	}
}
