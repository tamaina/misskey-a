/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { DataSource } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { MiBrowserSession } from './models/BrowserSession.js';
import { MiPasswordResetRequest } from './models/PasswordResetRequest.js';
import { generateNativeUserToken } from './utility/token.js';

export interface PasswordRecoveryDependencies {
	db: Pick<DataSource, 'transaction'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}
/** Recovering a password preserves MFA. A reset link never creates a login session. */
export async function recoverPassword(deps: PasswordRecoveryDependencies, userId: string, hash: string,
	request?: { id: string; token: string; issuedAt: number }) {
	const rotated = await deps.db.transaction(async manager => {
		const user = await manager.getRepository(MiUser).findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
		const profile = await manager.getRepository(MiUserProfile).findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } });
		if (!user || user.host !== null || user.isDeleted || !user.token || !profile) throw new Error('Password recovery failed');
		if (request) {
			const current = await manager.getRepository(MiPasswordResetRequest).findOne({ where: { id: request.id, userId, token: request.token }, lock: { mode: 'pessimistic_write' } });
			if (!current || !Number.isFinite(request.issuedAt) || request.issuedAt > Date.now() || Date.now() - request.issuedAt >= 30 * 60_000) throw new Error('Password recovery failed');
		}
		// Delete every outstanding link in the same transaction, including this claim.
		await manager.getRepository(MiPasswordResetRequest).delete({ userId });
		await manager.getRepository(MiUserProfile).update({ userId }, { password: hash, passwordLoginDisabled: false });
		const newToken = generateNativeUserToken();
		await manager.getRepository(MiUser).update({ id: userId }, { token: newToken });
		await manager.getRepository(MiBrowserSession).update({ userId }, { revokedAt: new Date(), sudoUntil: null, sudoPolicyStamp: null });
		if (request && Date.now() - request.issuedAt >= 30 * 60_000) throw new Error('Password recovery failed');
		return { id: userId, oldToken: user.token, newToken };
	});
	deps.globalEventService.publishInternalEvent('browserSessionRevoked', { id: null, userId });
	deps.globalEventService.publishInternalEvent('userTokenRegenerated', rotated);
}
