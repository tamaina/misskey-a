/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { FreshPasskeyReauthentication } from '../../fresh-passkey-reauthentication.js';
import { changeEmail, emailChangeTargetStamp } from '../../email-change.js';
import type { EmailChangeDependencies } from '../../email-change.js';
import { toWebAuthnAuthenticationOptions } from '../../webauthn.schema.js';
import { IUpdateEmailPasskeyStartContract, IUpdateEmailPasskeyCompleteContract } from '../../api.definition.js';

export interface UpdateEmailPasskeyDependencies extends EmailChangeDependencies {
	freshReauthentication: Pick<FreshPasskeyReauthentication, 'begin' | 'complete'>;
	userProfilesRepository: Pick<UserProfilesRepository, 'findOneByOrFail'>;
}
const failed = () => apiError({ code: 'FRESH_REAUTHENTICATION_FAILED', message: 'Fresh reauthentication failed. Start again.', id: 'c14366e5-244c-4387-ac8c-1384cd783aba', status: 403 });
export function createUpdateEmailPasskeyStartProcedure(deps: UpdateEmailPasskeyDependencies) {
	return createApiProcedure<MiLocalUser>()(IUpdateEmailPasskeyStartContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		try {
			if (context.token || !context.browserSession || context.browserSession.userId !== context.principal.id) throw failed();
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: context.principal.id });
			const result = await deps.freshReauthentication.begin({ userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token }, 'update-email', input.currentPassword, emailChangeTargetStamp(input.email, profile));
			return { ticket: result.ticket, options: toWebAuthnAuthenticationOptions(result.options) };
		} catch { throw failed(); }
	});
}
export function createUpdateEmailPasskeyCompleteProcedure(deps: UpdateEmailPasskeyDependencies) {
	return createApiProcedure<MiLocalUser>()(IUpdateEmailPasskeyCompleteContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		try {
			if (context.token || !context.browserSession || context.browserSession.userId !== context.principal.id) throw failed();
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: context.principal.id });
			const proof = await deps.freshReauthentication.complete({ userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token }, 'update-email', input.ticket, input.credential, emailChangeTargetStamp(input.email, profile));
			if (proof.userId !== context.principal.id || proof.sessionId !== context.browserSession.id || proof.purpose !== 'update-email') throw failed();
			await changeEmail(deps, context.principal.id, input.email, { kind: 'fresh', proof });
		} catch { throw failed(); }
	});
}
