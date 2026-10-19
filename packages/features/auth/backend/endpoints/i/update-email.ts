/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import bcrypt from 'bcryptjs';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import type { UserAuthService } from '../../services/UserAuthService.js';
import { assertLegacyMfaManagement } from '../../mfa-policy.js';
import { changeEmail, emailChangeErrors } from '../../email-change.js';
import type { EmailChangeDependencies } from '../../email-change.js';
import { IUpdateEmailContract } from '../../api.definition.js';

export const meta = { errors: emailChangeErrors } as const;
export interface IUpdateEmailDependencies extends EmailChangeDependencies {
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
}
export function createIUpdateEmailProcedure(deps: IUpdateEmailDependencies) {
	return createApiProcedure<MiLocalUser>()(IUpdateEmailContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const me = context.principal;
		const user = await deps.usersRepository.findOneByOrFail({ id: me.id });
		if (!user.token || (!context.browserSession && context.credential !== user.token)) throw new Error('authentication failed');
		const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });
		assertLegacyMfaManagement(profile);
		const expected = { ...profile };
		if (profile.twoFactorEnabled) {
			if (input.token == null) throw new Error('authentication failed');
			try { await deps.userAuthService.twoFactorAuthenticate(profile, input.token); } catch { throw new Error('authentication failed'); }
		}
		if (!await bcrypt.compare(input.password, profile.password!)) throw apiError(meta.errors.incorrectPassword);
		return toPackedUserDetailed(await changeEmail(deps, me.id, input.email ?? null, { kind: 'legacy', nativeToken: user.token, profile: expected, session: context.browserSession, omitEmail: input.email === undefined }));
	});
}
