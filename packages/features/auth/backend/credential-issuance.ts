/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SudoService, SudoIdentity } from './sudo.js';
import type { AuthenticatedContext } from '../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { apiError } from '../../api/backend/transport/orpc-error.js';
export type CredentialIssuanceAuthorization = Pick<SudoService, 'transaction'>;
/** A master credential or scoped token cannot substitute for an individual sudo session. */
export function credentialIssuanceIdentity(context: AuthenticatedContext<MiLocalUser>): SudoIdentity {
	if (!context.principal || !context.browserSession || context.token != null || context.principal.id !== context.browserSession.userId) {
		throw apiError({ code: 'AUTHENTICATION_FAILED', status: 401, message: 'Sign in with an individual browser session and confirm local authentication.', id: '09d4c343-dd3e-4b5a-b5cc-22b0bca605b3' });
	}
	return { userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token };
}
