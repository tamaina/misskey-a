/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { WebAuthnService } from '../../../services/WebAuthnService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';
import * as v from 'valibot';
import { I2faRegisterKeyContract } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
import { toWebAuthnRegistrationOptions } from '../../../webauthn.schema.js';
export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		userNotFound: {
			message: 'User not found.',
			code: 'USER_NOT_FOUND',
			id: '652f899f-66d4-490e-993e-6606c8ec04c3',
		},

		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '38769596-efe2-4faf-9bec-abbb3f2cd9ba',
		},

		twoFactorNotEnabled: {
			message: '2fa not enabled.',
			code: 'TWO_FACTOR_NOT_ENABLED',
			id: 'bf32b864-449b-47b8-974e-f9a5468546f1',
		},
	},
} as const;
export interface I2faRegisterKeyDependencies {
	userProfilesRepository: UserProfilesRepository;
	webAuthnService: Pick<WebAuthnService, 'initiateRegistration'>;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
}
export function createI2faRegisterKeyProcedure(deps: I2faRegisterKeyDependencies) {
	return implement(I2faRegisterKeyContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'i/2fa/register-key', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token;
			const profile = await deps.userProfilesRepository.findOne({
				where: {
					userId: me.id,
				},
				relations: { user: true },
			});

			if (profile == null) {
				throw apiError(meta.errors.userNotFound);
			}

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await deps.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					throw new Error('authentication failed');
				}
			}

			const passwordMatched = await bcrypt.compare(ps.password, profile.password ?? '');
			if (!passwordMatched) {
				throw apiError(meta.errors.incorrectPassword);
			}

			if (!profile.twoFactorEnabled) {
				throw apiError(meta.errors.twoFactorNotEnabled);
			}

			return await deps.webAuthnService.initiateRegistration(
				me.id,
				profile.user?.username ?? me.id,
				profile.user?.name ?? undefined,
			);
		})();
		return v.parse(requiredSchema(I2faRegisterKeyContract['~orpc'].outputSchema), toWebAuthnRegistrationOptions(result));
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
