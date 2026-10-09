/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { WebAuthnService } from '../../../services/WebAuthnService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';
import * as v from 'valibot';
import { I2faKeyDoneContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '0d7ec6d2-e652-443e-a7bf-9ee9a0cd77b0',
		},

		twoFactorNotEnabled: {
			message: '2fa not enabled.',
			code: 'TWO_FACTOR_NOT_ENABLED',
			id: '798d6847-b1ed-4f9c-b1f9-163c42655995',
		},
	},
} as const;
export interface I2faKeyDoneDependencies {
	userProfilesRepository: UserProfilesRepository;
	userSecurityKeysRepository: UserSecurityKeysRepository;
	webAuthnService: Pick<WebAuthnService, 'verifyRegistration'>;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faKeyDoneProcedure(deps: I2faKeyDoneDependencies) {
	return implement(I2faKeyDoneContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'i/2fa/key-done', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token;
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

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

			const keyInfo = await deps.webAuthnService.verifyRegistration(me.id, ps.credential);
			const keyId = keyInfo.credentialID;

			await deps.userSecurityKeysRepository.insert({
				id: keyId,
				userId: me.id,
				name: ps.name,
				publicKey: Buffer.from(keyInfo.credentialPublicKey).toString('base64url'),
				counter: keyInfo.counter,
				credentialDeviceType: keyInfo.credentialDeviceType,
				credentialBackedUp: keyInfo.credentialBackedUp,
				transports: keyInfo.transports,
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {
				id: keyId,
				name: ps.name,
			};
		})();
		return v.parse(requiredSchema(I2faKeyDoneContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
