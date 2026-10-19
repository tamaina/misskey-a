/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { FreshPasskeyReauthentication } from '../../fresh-passkey-reauthentication.js';
import { regenerateToken } from '../../token-regeneration.js';
import type { TokenRegenerationDependencies } from '../../token-regeneration.js';
import { toWebAuthnAuthenticationOptions } from '../../webauthn.schema.js';
import { IRegenerateTokenPasskeyStartContract, IRegenerateTokenPasskeyCompleteContract } from '../../api.definition.js';

export interface RegenerateTokenPasskeyDependencies extends TokenRegenerationDependencies {
	freshReauthentication: Pick<FreshPasskeyReauthentication, 'begin' | 'complete'>;
}

const failed = () => apiError({ code: 'FRESH_REAUTHENTICATION_FAILED', message: 'Fresh reauthentication failed. Start again.', id: 'aebef449-c37e-4ac6-9d55-b4c4975d095e', status: 403 });

export function createRegenerateTokenPasskeyStartProcedure(deps: RegenerateTokenPasskeyDependencies) {
	return createApiProcedure<MiLocalUser>()(IRegenerateTokenPasskeyStartContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		try {
			if (context.token || !context.browserSession || context.browserSession.userId !== context.principal.id) throw failed();
			const result = await deps.freshReauthentication.begin({ userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token }, 'regenerate-token', input.currentPassword);
			return { ticket: result.ticket, options: toWebAuthnAuthenticationOptions(result.options) };
		} catch { throw failed(); }
	});
}

export function createRegenerateTokenPasskeyCompleteProcedure(deps: RegenerateTokenPasskeyDependencies) {
	return createApiProcedure<MiLocalUser>()(IRegenerateTokenPasskeyCompleteContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		try {
			if (context.token || !context.browserSession || context.browserSession.userId !== context.principal.id) throw failed();
			const proof = await deps.freshReauthentication.complete({ userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token }, 'regenerate-token', input.ticket, input.credential);
			if (proof.userId !== context.principal.id || proof.sessionId !== context.browserSession.id || proof.purpose !== 'regenerate-token') throw failed();
			await regenerateToken(deps, context.principal.id, { kind: 'fresh', proof });
		} catch { throw failed(); }
	});
}
