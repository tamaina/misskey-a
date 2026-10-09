/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { generateNativeUserToken } from '../../utility/token.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import * as v from 'valibot';
import { IRegenerateTokenContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	requireCredential: true,

	secure: true,
} as const;
export interface IRegenerateTokenDependencies {
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent' | 'publishMainStream'>;
}
export function createIRegenerateTokenProcedure(deps: IRegenerateTokenDependencies) {
	return implement(IRegenerateTokenContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'i/regenerate-token', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const freshUser = await deps.usersRepository.findOneByOrFail({ id: me.id });
			const oldToken = freshUser.token!;

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			const newToken = generateNativeUserToken();

			await deps.usersRepository.update(me.id, {
				token: newToken,
			});

			// Publish event
			deps.globalEventService.publishInternalEvent('userTokenRegenerated', { id: me.id, oldToken, newToken });
			deps.globalEventService.publishMainStream(me.id, 'myTokenRegenerated');
		})();
		return v.parse(requiredSchema(IRegenerateTokenContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
