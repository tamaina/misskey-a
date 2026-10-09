/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';

import { antennasCreateInput, antennasCreateErrors } from '../../endpoints/antennas/create.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import type { UserListsRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class AntennasCreateApplicationService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private antennaEntityService: AntennaEntityService,
		private roleService: RoleService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<typeof antennasCreateInput>, me: MiLocalUser) {
		if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
			throw apiError(antennasCreateErrors.emptyKeyword);
		}

		const currentAntennasCount = await this.antennasRepository.countBy({
			userId: me.id,
		});
		if (currentAntennasCount >= (await this.roleService.getUserPolicies(me.id)).antennaLimit) {
			throw apiError(antennasCreateErrors.tooManyAntennas);
		}

		let userList;

		if (ps.src === 'list' && ps.userListId) {
			userList = await this.userListsRepository.findOneBy({
				id: ps.userListId,
				userId: me.id,
			});

			if (userList == null) {
				throw apiError(antennasCreateErrors.noSuchUserList);
			}
		}

		const now = new Date();

		const antenna = await this.antennasRepository.insertOne({
			id: this.idService.gen(now.getTime()),
			lastUsedAt: now,
			userId: me.id,
			name: ps.name,
			src: ps.src,
			userListId: userList ? userList.id : null,
			keywords: ps.keywords,
			excludeKeywords: ps.excludeKeywords,
			users: ps.users,
			caseSensitive: ps.caseSensitive,
			localOnly: ps.localOnly,
			excludeBots: ps.excludeBots,
			withReplies: ps.withReplies,
			withFile: ps.withFile,
			excludeNotesInSensitiveChannel: ps.excludeNotesInSensitiveChannel,
		});

		this.globalEventService.publishInternalEvent('antennaCreated', antenna);

		return await this.antennaEntityService.pack(antenna);
	}
}
