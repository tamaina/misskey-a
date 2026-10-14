/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import * as v from 'valibot';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import type { BrowserSessionIdentity } from '@features/api/backend/transport/context.js';
import type { MfaPolicySnapshot } from './mfa-policy.js';
import type { MiUserSecurityKey } from './models/UserSecurityKey.js';
import type { BrowserSessionService } from './services/BrowserSessionService.js';
import { FreshReauthenticationStore, freshReauthenticationPurposeSchema } from './fresh-reauthentication-store.js';
import type { FreshReauthenticationBinding, FreshReauthenticationPurpose } from './fresh-reauthentication-store.js';
import { webAuthnAuthenticationResponseSchema, webAuthnTransportSchema } from './webauthn.schema.js';
import { normalizedPasskeyPublicKey } from './passkey-public-key.js';

/** Server-owned API context only. No token or wire object is an identity proof. */
export interface FreshReauthenticationIdentity {
	userId: string;
	browserSession?: BrowserSessionIdentity;
	accessToken?: unknown;
}

/** Counters, last-used dates and recovery consumption do not change credential policy. */
export function freshReauthenticationPolicyStamp(profile: MfaPolicySnapshot, keys: Pick<MiUserSecurityKey, 'id' | 'userId' | 'publicKey'>[]): string {
	if (keys.some(key => key.userId !== profile.userId)) throw new Error('Fresh reauthentication failed');
	return createHash('sha256').update(JSON.stringify([
		profile.userId, profile.password ?? null, profile.twoFactorEnabled === true,
		profile.twoFactorSecret ?? null, profile.passkeyMfaEnabled === true,
		keys.map(key => [key.id, normalizedPasskeyPublicKey(key.publicKey)]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
	])).digest('hex');
}

/** Unconnected verifier: no DI registration, endpoint, activation writer or grant.
 * A future mutation must recheck this session and policy under its own DB locks.
 * The returned metadata is never a reusable sudo or activation credential.
 */
export class FreshPasskeyReauthentication {
	constructor(
		private store: FreshReauthenticationStore,
		private sessions: Pick<BrowserSessionService, 'isActive'>,
		private profiles: Pick<UserProfilesRepository, 'findOneByOrFail'>,
		private keys: Pick<UserSecurityKeysRepository, 'findBy' | 'update'>,
		private relyingParty: { origin: string; rpId: string },
	) {}

	private async binding(identity: FreshReauthenticationIdentity, purpose: FreshReauthenticationPurpose): Promise<FreshReauthenticationBinding> {
		v.parse(freshReauthenticationPurposeSchema, purpose);
		const session = identity.browserSession;
		if (identity.accessToken != null || !session || session.userId !== identity.userId
			|| !await this.sessions.isActive(session.id, identity.userId)) throw new Error('Fresh reauthentication failed');
		return { userId: identity.userId, sessionId: session.id, purpose };
	}

	private async snapshot(userId: string) {
		const profile = await this.profiles.findOneByOrFail({ userId });
		const keys = await this.keys.findBy({ userId });
		if (profile.userId !== userId || !profile.password || keys.length === 0) throw new Error('Fresh reauthentication failed');
		return { profile, keys, stamp: freshReauthenticationPolicyStamp(profile, keys) };
	}

	async begin(identity: FreshReauthenticationIdentity, purpose: FreshReauthenticationPurpose, password: string) {
		const deadline = performance.now() + 90_000;
		const binding = await this.binding(identity, purpose);
		// Anchor to Redis time BEFORE the password proof; queued create cannot renew it.
		const expiresAt = await this.store.startDeadline();
		const before = await this.snapshot(binding.userId);
		if (!await bcrypt.compare(password, before.profile.password!)) throw new Error('Fresh reauthentication failed');
		const options = await generateAuthenticationOptions({
			rpID: this.relyingParty.rpId, userVerification: 'required',
			allowCredentials: before.keys.map(key => ({ id: key.id, transports: key.transports == null ? undefined : v.parse(v.array(webAuthnTransportSchema), key.transports) })),
		});
		const after = await this.snapshot(binding.userId);
		if (before.stamp !== after.stamp) throw new Error('Fresh reauthentication failed');
		await this.binding(identity, purpose);
		const remainingMs = Math.floor(deadline - performance.now());
		if (remainingMs <= 0) throw new Error('Fresh reauthentication failed');
		const ticket = await this.store.create({ ...binding, policyStamp: before.stamp, challenge: options.challenge }, expiresAt);
		if (performance.now() >= deadline) throw new Error('Fresh reauthentication failed');
		return { ticket, options };
	}

	async complete(identity: FreshReauthenticationIdentity, purpose: FreshReauthenticationPurpose, ticket: string, response: unknown) {
		const binding = await this.binding(identity, purpose);
		// Include Redis round-trip time in the conservative monotonic deadline.
		const started = performance.now();
		const claimed = await this.store.consume(binding, ticket);
		if (!claimed) throw new Error('Fresh reauthentication failed');
		const deadline = started + claimed.remainingMs;
		const before = await this.snapshot(binding.userId);
		if (before.stamp !== claimed.record.policyStamp || performance.now() >= deadline) throw new Error('Fresh reauthentication failed');
		const credential = v.parse(webAuthnAuthenticationResponseSchema, response);
		const key = before.keys.find(key => key.id === credential.id);
		if (!key) throw new Error('Fresh reauthentication failed');
		const publicKey = normalizedPasskeyPublicKey(key.publicKey);
		const result = await verifyAuthenticationResponse({
			response: credential, expectedChallenge: claimed.record.challenge,
			expectedOrigin: this.relyingParty.origin, expectedRPID: this.relyingParty.rpId,
			requireUserVerification: true,
			credential: { id: key.id, publicKey: Buffer.from(publicKey, 'base64url'), counter: Number(key.counter), transports: key.transports == null ? undefined : v.parse(v.array(webAuthnTransportSchema), key.transports) },
		});
		if (!result.verified || !result.authenticationInfo.userVerified) throw new Error('Fresh reauthentication failed');
		// Compare-and-update prevents a concurrent assertion from rewinding counters.
		const updated = await this.keys.update({ id: key.id, userId: binding.userId, publicKey: key.publicKey, counter: key.counter }, {
			publicKey, counter: result.authenticationInfo.newCounter, lastUsed: new Date(),
			credentialDeviceType: result.authenticationInfo.credentialDeviceType, credentialBackedUp: result.authenticationInfo.credentialBackedUp,
		});
		if (updated.affected !== 1) throw new Error('Fresh reauthentication failed');
		const after = await this.snapshot(binding.userId);
		await this.binding(identity, purpose);
		if (after.stamp !== claimed.record.policyStamp || performance.now() >= deadline) throw new Error('Fresh reauthentication failed');
		return { ...binding, policyStamp: after.stamp };
	}
}
