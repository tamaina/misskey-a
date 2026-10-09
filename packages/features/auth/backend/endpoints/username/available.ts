/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import type { MiMeta, UsedUsernamesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import * as v from 'valibot';
import { UsernameAvailableContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	tags: ['users'],

	requireCredential: false,
} as const;
export interface UsernameAvailableDependencies {
	serverSettings: MiMeta;
	usersRepository: UsersRepository;
	usedUsernamesRepository: UsedUsernamesRepository;
}
export function createUsernameAvailableProcedure(deps: UsernameAvailableDependencies) {
	return implement(UsernameAvailableContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'username/available' })).handler(async ({ input, context }) => {
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
		return v.parse(requiredSchema(UsernameAvailableContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
