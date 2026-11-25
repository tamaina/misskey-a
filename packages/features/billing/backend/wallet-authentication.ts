/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { toWebAuthnAuthenticationOptions } from '@features/auth/backend/webauthn.schema.js';
import type { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import type { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { WalletAuthentication } from './wallet-service.js';

export interface WalletAuthenticationDependencies {
	profiles: Pick<UserProfilesRepository, 'findOneByOrFail'>;
	auth: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	passkeys: Pick<WebAuthnService, 'initiateAuthentication' | 'verifyAuthentication'>;
	passwordMatches?: typeof bcrypt.compare;
}

export function createWalletAuthentication(deps: WalletAuthenticationDependencies) {
	return {
		async passkeyOptions(userId: string) {
			return toWebAuthnAuthenticationOptions(await deps.passkeys.initiateAuthentication(userId));
		},
		async reauthenticate(userId: string, input: WalletAuthentication, credential?: string | null) {
			const fail = () => apiError({ code: 'WALLET_REAUTHENTICATION_REQUIRED', message: 'Authenticate again to register a wallet.', id: '930b9449-6451-4148-82c4-547986f1942a' });
			if (!credential) throw fail();
			// Native browser logins reuse user.token; it cannot identify a recent-auth session.
			// Require explicit password/TOTP or a fresh one-use native passkey response on every begin.
			try {
				if (input.passkey !== undefined) {
					if (!await deps.passkeys.verifyAuthentication(userId, input.passkey)) throw fail();
				} else {
					const profile = await deps.profiles.findOneByOrFail({ userId });
					if (!profile.password || !input.currentPassword || !await (deps.passwordMatches ?? bcrypt.compare)(input.currentPassword, profile.password)) throw fail();
					if (profile.twoFactorEnabled) {
						if (!input.twoFactorToken) throw fail();
						await deps.auth.twoFactorAuthenticate(profile, input.twoFactorToken);
					}
				}
			} catch { throw fail(); }
		},
	};
}
