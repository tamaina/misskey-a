/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { IsNull } from 'typeorm';
import type { MiMeta, UsedUsernamesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';

import { UsernameAvailableContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['users'],

} as const;
export interface UsernameAvailableDependencies {
	serverSettings: MiMeta;
	usersRepository: UsersRepository;
	usedUsernamesRepository: UsedUsernamesRepository;
}
export function createUsernameAvailableProcedure(deps: UsernameAvailableDependencies) {
	return createApiProcedure<MiLocalUser>()(UsernameAvailableContract).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			const exist = await deps.usersRepository.countBy({
				host: IsNull(),
				usernameLower: ps.username.toLowerCase(),
			});

			const exist2 = await deps.usedUsernamesRepository.countBy({ username: ps.username.toLowerCase() });

			const isPreserved = deps.serverSettings.preservedUsernames.map(x => x.toLowerCase()).includes(ps.username.toLowerCase());

			return {
				available: exist === 0 && exist2 === 0 && !isPreserved,
			};
		})();
		return result;
	});
}
