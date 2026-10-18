/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { OidcLocalAuthorization, OidcLocalIdentity } from './oidc-runtime.js';
import type { ApiContext } from '../../api/backend/transport/context.js';
import { apiError } from '../../api/backend/transport/orpc-error.js';
export type CredentialIssuanceAuthorization = OidcLocalAuthorization;
/** A master credential or scoped token cannot substitute for an individual sudo session. */
export function credentialIssuanceIdentity(context: ApiContext): OidcLocalIdentity {
	if (!context.principal || !context.browserSession || context.token != null || context.principal.id !== context.browserSession.userId) {
		throw apiError({ code: 'AUTHENTICATION_FAILED', status: 401, message: 'Sign in with an individual browser session and confirm local authentication.', id: '09d4c343-dd3e-4b5a-b5cc-22b0bca605b3' });
	}
	return { userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token };
}
