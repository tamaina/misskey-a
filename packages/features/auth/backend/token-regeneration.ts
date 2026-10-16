/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { performance } from 'node:perf_hooks';
import { IsNull } from 'typeorm';
import type { DataSource } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { BrowserSessionIdentity } from '@features/api/backend/transport/context.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { MiBrowserSession } from './models/BrowserSession.js';
import { MiUserSecurityKey } from './models/UserSecurityKey.js';
import type { BrowserSessionService } from './services/BrowserSessionService.js';
import type { FreshPasskeyReauthentication } from './fresh-passkey-reauthentication.js';
import { freshReauthenticationPolicyStamp } from './fresh-passkey-reauthentication.js';
import { assertLegacyMfaManagement, assertSameMfaPolicy } from './mfa-policy.js';
import type { MfaPolicySnapshot } from './mfa-policy.js';
import { generateNativeUserToken } from './utility/token.js';

export interface TokenRegenerationDependencies {
	db: Pick<DataSource, 'transaction'>;
	browserSessionService: Pick<BrowserSessionService, 'revokeAllOwned'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent' | 'publishMainStream'>;
}

type Authority = {
	kind: 'legacy'; nativeToken: string; profile: MfaPolicySnapshot; session?: BrowserSessionIdentity;
} | {
	kind: 'fresh'; proof: Awaited<ReturnType<FreshPasskeyReauthentication['complete']>>;
};

/** No grant or replacement credential escapes this operation. All issuers take
 * the user lock first, so rotation and browser-session issuance serialize.
 */
export async function regenerateToken(deps: TokenRegenerationDependencies, userId: string, authority: Authority): Promise<void> {
	const result = await deps.db.transaction(async manager => {
		const user = await manager.getRepository(MiUser).findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
		if (!user || user.host !== null || user.isDeleted || user.isSuspended || !user.token) throw new Error('authentication failed');
		const profile = await manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId }, lock: { mode: 'pessimistic_write' } });
		if (profile.userId !== userId) throw new Error('authentication failed');
		const session = authority.kind === 'fresh' ? { id: authority.proof.sessionId, userId: authority.proof.userId } : authority.session;
		if (session && (session.userId !== userId || !await manager.getRepository(MiBrowserSession).findOne({ where: { id: session.id, userId, revokedAt: IsNull() }, lock: { mode: 'pessimistic_write' } }))) throw new Error('authentication failed');
		if (authority.kind === 'legacy') {
			assertLegacyMfaManagement(profile);
			assertSameMfaPolicy(authority.profile, profile);
			if (user.token !== authority.nativeToken) throw new Error('authentication failed');
		} else {
			const proof = authority.proof;
			const keys = await manager.getRepository(MiUserSecurityKey).findBy({ userId });
			if (proof.userId !== userId || proof.purpose !== 'regenerate-token' || freshReauthenticationPolicyStamp(profile, keys) !== proof.policyStamp || performance.now() >= proof.expiresAtMonotonic) throw new Error('authentication failed');
		}
		const oldToken = user.token;
		const newToken = generateNativeUserToken();
		await manager.getRepository(MiUser).update(userId, { token: newToken });
		await deps.browserSessionService.revokeAllOwned(userId, manager.getRepository(MiBrowserSession));
		// Expiry after either write rolls back the token and every revocation.
		if (authority.kind === 'fresh' && performance.now() >= authority.proof.expiresAtMonotonic) throw new Error('authentication failed');
		return { oldToken, newToken };
	});
	deps.globalEventService.publishInternalEvent('browserSessionRevoked', { id: null, userId });
	deps.globalEventService.publishInternalEvent('userTokenRegenerated', { id: userId, ...result });
	deps.globalEventService.publishMainStream(userId, 'myTokenRegenerated');
}
