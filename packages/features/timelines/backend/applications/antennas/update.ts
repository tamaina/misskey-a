/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import { type antennasUpdateContract, antennasUpdateErrors } from '../../endpoints/antennas/update.contract.js';
import type { AntennasRepository, UserListsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';

@Injectable()
export class AntennasUpdateApplicationService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private antennaEntityService: AntennaEntityService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof antennasUpdateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		if (ps.keywords && ps.excludeKeywords) {
			if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
				throw apiError(antennasUpdateErrors.emptyKeyword);
			}
		}
		// Fetch the antenna
		const antenna = await this.antennasRepository.findOneBy({
			id: ps.antennaId,
			userId: me.id,
		});

		if (antenna == null) {
			throw apiError(antennasUpdateErrors.noSuchAntenna);
		}

		let userList;

		if ((ps.src === 'list' || antenna.src === 'list') && ps.userListId) {
			userList = await this.userListsRepository.findOneBy({
				id: ps.userListId,
				userId: me.id,
			});

			if (userList == null) {
				throw apiError(antennasUpdateErrors.noSuchUserList);
			}
		}

		await this.antennasRepository.update(antenna.id, {
			name: ps.name,
			src: ps.src,
			userListId: ps.userListId !== undefined ? userList ? userList.id : null : undefined,
			keywords: ps.keywords,
			excludeKeywords: ps.excludeKeywords,
			users: ps.users,
			caseSensitive: ps.caseSensitive,
			localOnly: ps.localOnly,
			excludeBots: ps.excludeBots,
			withReplies: ps.withReplies,
			withFile: ps.withFile,
			excludeNotesInSensitiveChannel: ps.excludeNotesInSensitiveChannel,
			isActive: true,
			lastUsedAt: new Date(),
		});

		this.globalEventService.publishInternalEvent('antennaUpdated', await this.antennasRepository.findOneByOrFail({ id: antenna.id }));

		return await this.antennaEntityService.pack(antenna.id);
	}
}
