/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { antennasUpdateContract, antennasUpdateErrors } from './update.contract.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import type { AntennasRepository, UserListsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AntennasUpdateDependencies {
	antennasRepository: AntennasRepository;
	userListsRepository: UserListsRepository;
	antennaEntityService: AntennaEntityService;
	globalEventService: GlobalEventService;
}
export function createAntennasUpdateProcedure<Actor extends MiLocalUser>(deps: AntennasUpdateDependencies) {
	return implement(antennasUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: antennasUpdateContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account', prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			if (ps.keywords && ps.excludeKeywords) {
				if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
					throw apiError(antennasUpdateErrors.emptyKeyword);
				}
			}
			// Fetch the antenna
			const antenna = await deps.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});
			if (antenna == null) {
				throw apiError(antennasUpdateErrors.noSuchAntenna);
			}
			let userList;
			if ((ps.src === 'list' || antenna.src === 'list') && ps.userListId) {
				userList = await deps.userListsRepository.findOneBy({
					id: ps.userListId,
					userId: me.id,
				});
				if (userList == null) {
					throw apiError(antennasUpdateErrors.noSuchUserList);
				}
			}
			await deps.antennasRepository.update(antenna.id, {
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
			deps.globalEventService.publishInternalEvent('antennaUpdated', await deps.antennasRepository.findOneByOrFail({ id: antenna.id }));
			return await deps.antennaEntityService.pack(antenna.id);
		});
}
