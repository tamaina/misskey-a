/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedAntenna } from '@features/timelines/backend/antenna.schema.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { antennasCreateContract, antennasCreateErrors } from './create.contract.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserListsRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';

export interface AntennasCreateDependencies {
	antennasRepository: AntennasRepository;
	userListsRepository: UserListsRepository;
	antennaEntityService: AntennaEntityService;
	roleService: RoleService;
	idService: IdService;
	globalEventService: GlobalEventService;
}
export function createAntennasCreateProcedure<Actor extends MiLocalUser>(deps: AntennasCreateDependencies) {
	return createApiProcedure<Actor>()(antennasCreateContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
					throw apiError(antennasCreateErrors.emptyKeyword);
				}
				const currentAntennasCount = await deps.antennasRepository.countBy({
					userId: me.id,
				});
				if (currentAntennasCount >= (await deps.roleService.getUserPolicies(me.id)).antennaLimit) {
					throw apiError(antennasCreateErrors.tooManyAntennas);
				}
				let userList;
				if (ps.src === 'list' && ps.userListId) {
					userList = await deps.userListsRepository.findOneBy({
						id: ps.userListId,
						userId: me.id,
					});
					if (userList == null) {
						throw apiError(antennasCreateErrors.noSuchUserList);
					}
				}
				const now = new Date();
				const antenna = await deps.antennasRepository.insertOne({
					id: deps.idService.gen(now.getTime()),
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
				deps.globalEventService.publishInternalEvent('antennaCreated', antenna);
				return await deps.antennaEntityService.pack(antenna);
			})();
			return toPackedAntenna(result);
		});
}
