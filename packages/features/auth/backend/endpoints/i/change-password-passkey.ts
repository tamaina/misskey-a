/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import type { DataSource } from 'typeorm';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUser } from '@features/users/backend/models/User.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { MiBrowserSession } from '../../models/BrowserSession.js';
import { MiUserSecurityKey } from '../../models/UserSecurityKey.js';
import type { FreshPasskeyReauthentication } from '../../fresh-passkey-reauthentication.js';
import { freshReauthenticationPolicyStamp } from '../../fresh-passkey-reauthentication.js';
import { withLockedMfaProfile } from '../../locked-mfa-profile.js';
import { toWebAuthnAuthenticationOptions } from '../../webauthn.schema.js';
import { IChangePasswordPasskeyStartContract, IChangePasswordPasskeyCompleteContract } from '../../api.definition.js';

export interface ChangePasswordPasskeyDependencies {
	db: DataSource;
	freshReauthentication: Pick<FreshPasskeyReauthentication, 'begin' | 'complete'>;
}

const failed = () => apiError({ code: 'FRESH_REAUTHENTICATION_FAILED', message: 'Fresh reauthentication failed. Start again.', id: 'a4903975-2c64-4b32-a9f1-87cb15075501', status: 403 });

export function createChangePasswordPasskeyStartProcedure(deps: ChangePasswordPasskeyDependencies) {
	return createApiProcedure<MiLocalUser>()(IChangePasswordPasskeyStartContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		try {
			if (context.token || !context.browserSession || context.browserSession.userId !== context.principal.id) throw failed();
			const result = await deps.freshReauthentication.begin({ userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token }, 'change-password', input.currentPassword);
			return { ticket: result.ticket, options: toWebAuthnAuthenticationOptions(result.options) };
		} catch { throw failed(); }
	});
}

export function createChangePasswordPasskeyCompleteProcedure(deps: ChangePasswordPasskeyDependencies) {
	return createApiProcedure<MiLocalUser>()(IChangePasswordPasskeyCompleteContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		try {
			if (context.token || !context.browserSession || context.browserSession.userId !== context.principal.id) throw failed();
			// Prepare the expensive hash before claiming the single-use assertion.
			const hash = await bcrypt.hash(input.newPassword, 8);
			const proof = await deps.freshReauthentication.complete({ userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token }, 'change-password', input.ticket, input.credential);
			if (proof.userId !== context.principal.id || proof.sessionId !== context.browserSession?.id || proof.purpose !== 'change-password') throw failed();
			await withLockedMfaProfile(deps.db, proof.userId, undefined, async (profile, manager) => {
				// Revocation must serialize with the protected mutation too.
				const session = await manager.getRepository(MiBrowserSession).findOne({ where: { id: proof.sessionId, userId: proof.userId, revokedAt: IsNull() }, lock: { mode: 'pessimistic_write' } });
				const user = await manager.getRepository(MiUser).findOneBy({ id: proof.userId, host: IsNull(), isDeleted: false, isSuspended: false });
				const keys = await manager.getRepository(MiUserSecurityKey).findBy({ userId: proof.userId });
				if (!session || !user || freshReauthenticationPolicyStamp(profile, keys) !== proof.policyStamp || performance.now() >= proof.expiresAtMonotonic) throw failed();
				await manager.getRepository(MiUserProfile).update({ userId: proof.userId }, { password: hash });
				if (performance.now() >= proof.expiresAtMonotonic) throw failed();
			});
		} catch { throw failed(); }
	});
}
