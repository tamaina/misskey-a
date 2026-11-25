/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { AuthenticatedContext } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { sudoContract } from './sudo.contract.js';
import { toWebAuthnAuthenticationOptions } from './webauthn.schema.js';
import { nativeCredentialFingerprint } from './fresh-passkey-reauthentication.js';
import { reauthenticationFailed } from './sudo.js';
import type { SudoService, SudoIdentity } from './sudo.js';
import type { BrowserSessionUsage } from './services/BrowserSessionService.js';

export function sudoIdentity(context: AuthenticatedContext<MiLocalUser>): SudoIdentity {
	return { userId: context.principal!.id, nativeCredentialFingerprint: !context.browserSession && context.token == null && context.credential ? nativeCredentialFingerprint(context.credential) : undefined, browserSession: context.browserSession, accessToken: context.token };
}

function requestUsage(context: AuthenticatedContext<MiLocalUser>): BrowserSessionUsage {
	return { ip: context.ip, userAgent: typeof context.headers['user-agent'] === 'string' ? context.headers['user-agent'] : null };
}

export interface SudoApiDependencies { sudoService: SudoService }
export function createSudoRouter({ sudoService }: SudoApiDependencies) {
	const procedure = createApiProcedure<MiLocalUser>();
	return {
		'i/sudo/start': procedure(sudoContract['i/sudo/start']).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
			const result = await sudoService.begin(sudoIdentity(context), input.password, input.token, input.usePasskey, requestUsage(context)).catch(() => { throw reauthenticationFailed(); });
			return result.status === 'elevated' ? result : { ...result, options: toWebAuthnAuthenticationOptions(result.options) };
		}),
		'i/sudo/complete': procedure(sudoContract['i/sudo/complete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) =>
			sudoService.complete(sudoIdentity(context), input.ticket, input.credential, requestUsage(context)).catch(() => { throw reauthenticationFailed(); })),
		'i/sudo/status': procedure(sudoContract['i/sudo/status']).use(requirePrincipal<MiLocalUser>()).handler(({ context }) => sudoService.status(sudoIdentity(context))),
		'i/sudo/exit': procedure(sudoContract['i/sudo/exit']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => sudoService.exit(sudoIdentity(context), input.expiresAt, input.grantId)),
	};
}
