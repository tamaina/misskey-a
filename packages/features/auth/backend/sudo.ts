/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import type { BrowserSessionIdentity } from '@features/api/backend/transport/context.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBrowserSession } from './models/BrowserSession.js';
import { MiUserSecurityKey } from './models/UserSecurityKey.js';
import { readMfaPolicy } from './mfa-policy.js';
import { freshReauthenticationPolicyStamp } from './fresh-passkey-reauthentication.js';
import type { FreshPasskeyReauthentication, FreshReauthenticationIdentity } from './fresh-passkey-reauthentication.js';
import type { TotpService } from './services/TotpService.js';

export const sudoRequired = () => apiError({ code: 'SUDO_REQUIRED', status: 403,
	message: 'Please confirm your identity to continue.', id: 'b0a7b8cb-3d49-4903-af41-88123c706314' });
export const reauthenticationFailed = () => apiError({ code: 'REAUTHENTICATION_FAILED', status: 403,
	message: 'Identity confirmation failed. Please start again.', id: 'e4d6b403-1443-4afb-b488-d90868471c54' });

export type SudoIdentity = FreshReauthenticationIdentity;
export interface LockedSudoContext {
	manager: EntityManager;
	user: MiUser;
	profile: MiUserProfile;
	keys: MiUserSecurityKey[];
	session: MiBrowserSession;
}

/** Every policy/credential change invalidates an elevation without waiting for a cache. */
export function sudoPolicyStamp(user: Pick<MiUser, 'id' | 'token'>, profile: MiUserProfile, keys: MiUserSecurityKey[]) {
	if (user.id !== profile.userId) throw reauthenticationFailed();
	return createHash('sha256').update(JSON.stringify([user.id, user.token,
		freshReauthenticationPolicyStamp(profile, keys), profile.usePasswordLessLogin === true])).digest('hex');
}

/** Five minutes belong to one durable browser session, never to a bearer grant. */
export class SudoService {
	constructor(private db: DataSource, private fresh: FreshPasskeyReauthentication,
		private totp: Pick<TotpService, 'twoFactorAuthenticate'>) {}

	private identity(identity: SudoIdentity): BrowserSessionIdentity {
		if (identity.accessToken != null || !identity.browserSession || identity.browserSession.userId !== identity.userId) throw reauthenticationFailed();
		return identity.browserSession;
	}

	/** The caller holds user -> profile locks. This adds the session lock in that order. */
	async lock(identity: SudoIdentity, manager: EntityManager, user: MiUser, profile: MiUserProfile): Promise<LockedSudoContext> {
		const owner = this.identity(identity);
		if (user.id !== owner.userId || user.host !== null || user.isDeleted || user.isSuspended || !user.token || profile.userId !== user.id) throw reauthenticationFailed();
		const session = await manager.getRepository(MiBrowserSession).findOne({
			where: { id: owner.id, userId: owner.userId, revokedAt: IsNull() },
			select: { id: true, userId: true, createdAt: true, lastUsedAt: true, revokedAt: true, sudoUntil: true, sudoPolicyStamp: true, sudoGrantId: true }, lock: { mode: 'pessimistic_write' },
		});
		if (!session) throw reauthenticationFailed();
		const keys = await manager.getRepository(MiUserSecurityKey).findBy({ userId: user.id });
		return { manager, user, profile, session, keys };
	}

	assert(context: LockedSudoContext): number {
		const until = context.session.sudoUntil?.getTime();
		if (!context.session.sudoGrantId || !until || until <= Date.now() || until > Date.now() + 300_000
			|| context.session.sudoPolicyStamp !== sudoPolicyStamp(context.user, context.profile, context.keys)) throw sudoRequired();
		return until;
	}

	async transaction<T>(identity: SudoIdentity, run: (context: LockedSudoContext) => Promise<T>, requireElevation = true): Promise<T> {
		this.identity(identity);
		return this.db.transaction(async manager => {
			const user = await manager.getRepository(MiUser).findOneOrFail({ where: { id: identity.userId }, lock: { mode: 'pessimistic_write' } });
			const profile = await manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId: identity.userId }, lock: { mode: 'pessimistic_write' } });
			const locked = await this.lock(identity, manager, user, profile);
			const until = requireElevation ? this.assert(locked) : null;
			const result = await run(locked);
			// Waiting for a write cannot extend the elevation. Throwing rolls it back.
			if (until !== null && Date.now() >= until) throw sudoRequired();
			return result;
		});
	}

	async status(identity: SudoIdentity): Promise<{ active: boolean; expiresAt: string | null }> {
		return this.transaction(identity, async locked => {
			try { return { active: true, expiresAt: new Date(this.assert(locked)).toISOString() }; }
			catch { return { active: false, expiresAt: null }; }
		}, false);
	}

	async exit(identity: SudoIdentity, expiresAt?: string, grantId?: string): Promise<void> {
		await this.transaction(identity, async ({ manager, session }) => {
			if (expiresAt !== undefined && (!grantId || session.sudoGrantId !== grantId || session.sudoUntil?.toISOString() !== expiresAt)) return;
			await manager.getRepository(MiBrowserSession).update({ id: session.id, userId: session.userId }, { sudoUntil: null, sudoPolicyStamp: null, sudoGrantId: null });
		}, false);
	}

	async begin(identity: SudoIdentity, password: string | undefined, token?: string, usePasskey = false) {
		this.identity(identity);
		const deadline = performance.now() + 90_000;
		const user = await this.db.getRepository(MiUser).findOneByOrFail({ id: identity.userId });
		const profile = await this.db.getRepository(MiUserProfile).findOneByOrFail({ userId: identity.userId });
		const keys = await this.db.getRepository(MiUserSecurityKey).findBy({ userId: identity.userId });
		const expected = sudoPolicyStamp(user, profile, keys);
		const strictPrimary = profile.passwordLoginDisabled === true && profile.usePasswordLessLogin === true && !profile.passkeyMfaEnabled && keys.length > 0;
		if (profile.passwordLoginDisabled === true && !strictPrimary) throw reauthenticationFailed();
		if (!strictPrimary && (!profile.password || password === undefined || !await bcrypt.compare(password, profile.password))) throw reauthenticationFailed();
		const policy = readMfaPolicy(profile, keys.length);
		if (usePasskey || strictPrimary) {
			if (!policy.passkey && !strictPrimary) throw reauthenticationFailed();
			const started = await this.fresh.begin(identity, 'sudo', password);
			if (performance.now() >= deadline) throw reauthenticationFailed();
			return { status: 'passkey-required' as const, ...started };
		}
		if (policy.required) {
			// Backup codes are usable even when TOTP is disabled. Ordinary OTPs are not.
			if (!token || (!policy.totp && !profile.twoFactorBackupSecret?.includes(token))) throw reauthenticationFailed();
			await this.totp.twoFactorAuthenticate(profile, token);
		}
		return this.grant(identity, deadline, locked => sudoPolicyStamp(locked.user, locked.profile, locked.keys) === expected);
	}

	async complete(identity: SudoIdentity, ticket: string, credential: unknown) {
		const proof = await this.fresh.complete(identity, 'sudo', ticket, credential);
		return this.grant(identity, proof.expiresAtMonotonic, locked =>
			(readMfaPolicy(locked.profile, locked.keys.length).passkey || (locked.profile.passwordLoginDisabled && locked.profile.usePasswordLessLogin && !locked.profile.passkeyMfaEnabled && locked.keys.length > 0))
			&& freshReauthenticationPolicyStamp(locked.profile, locked.keys) === proof.policyStamp);
	}

	private async grant(identity: SudoIdentity, deadline: number, proofMatches: (context: LockedSudoContext) => boolean) {
		return this.transaction(identity, async locked => {
			if (performance.now() >= deadline || !proofMatches(locked)) throw reauthenticationFailed();
			const until = new Date(Date.now() + 300_000);
			const grantId = randomBytes(32).toString('base64url');
			await locked.manager.getRepository(MiBrowserSession).update({ id: locked.session.id, userId: locked.user.id }, {
				sudoUntil: until, sudoGrantId: grantId, sudoPolicyStamp: sudoPolicyStamp(locked.user, locked.profile, locked.keys),
			});
			if (performance.now() >= deadline) throw reauthenticationFailed();
			return { status: 'elevated' as const, expiresAt: until.toISOString(), grantId };
		}, false);
	}
}
