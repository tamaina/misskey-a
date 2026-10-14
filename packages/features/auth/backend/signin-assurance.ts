/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiUserSecurityKey } from './models/UserSecurityKey.js';
import { readMfaPolicy } from './mfa-policy.js';
import { normalizedPasskeyPublicKey } from './passkey-public-key.js';

export class SigninPolicyError extends Error {
	constructor() { super('authentication failed'); }
}

export interface VerifiedSigninKey {
	readonly userId: string;
	readonly id: string;
	readonly publicKey: string;
	readonly deadline: number;
}

/** Capture BEFORE the password/factor proof; counters and recovery consumption are not policy changes. */
export function signinPolicyStamp(user: Pick<MiUser, 'id' | 'token'>, profile: MiUserProfile, keys: Pick<MiUserSecurityKey, 'id' | 'userId' | 'publicKey'>[]): string {
	if (profile.userId !== user.id || keys.some(key => key.userId !== user.id)) throw new SigninPolicyError();
	return createHash('sha256').update(JSON.stringify([
		user.id, user.token, profile.password ?? null, profile.twoFactorEnabled === true,
		profile.twoFactorSecret ?? null, profile.passkeyMfaEnabled === true, profile.usePasswordLessLogin === true,
		keys.map(key => [key.id, normalizedPasskeyPublicKey(key.publicKey)]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
	])).digest('hex');
}

const brand = Symbol('server-owned-signin-proof');
const pending = new WeakSet<object>();
interface SigninAssuranceFacts {
	readonly userId: string;
	readonly policyStamp: string;
	readonly mode: 'password' | 'passwordless';
	readonly passwordVerified: boolean;
	readonly factor: 'none' | 'totp' | 'passkey' | 'recovery';
	readonly key?: VerifiedSigninKey;
	readonly deadline: number;
}
export interface SigninAssurance extends SigninAssuranceFacts { readonly [brand]: true }

/** Server-only facts from completed verifiers, never a wire credential or reusable grant. */
export function createSigninAssurance(facts: SigninAssuranceFacts): SigninAssurance {
	const deadline = Math.min(facts.deadline, facts.key?.deadline ?? Number.POSITIVE_INFINITY);
	if (!Number.isFinite(deadline) || performance.now() >= deadline) throw new SigninPolicyError();
	const proof: SigninAssurance = Object.freeze({ ...facts, key: facts.key ? Object.freeze({ ...facts.key }) : undefined, deadline, [brand]: true as const });
	pending.add(proof);
	return proof;
}

export function consumeSigninAssurance(proof: SigninAssurance, userId: string): void {
	if (!pending.delete(proof) || proof.userId !== userId) throw new SigninPolicyError();
	assertSigninDeadline(proof);
}

export function assertSigninDeadline(proof: SigninAssurance): void {
	if (!Number.isFinite(proof.deadline) || performance.now() >= proof.deadline) throw new SigninPolicyError();
}

/** Called under user -> profile locks immediately before the transaction-owned session insert. */
export function assertCurrentSigninAssurance(proof: SigninAssurance, user: MiUser, profile: MiUserProfile, keys: MiUserSecurityKey[]): void {
	assertSigninDeadline(proof);
	if (user.id !== proof.userId || user.host !== null || user.isSuspended || user.isDeleted
		|| signinPolicyStamp(user, profile, keys) !== proof.policyStamp) throw new SigninPolicyError();
	const policy = readMfaPolicy(profile, keys.length);
	if (proof.key && (proof.key.userId !== user.id || !keys.some(key => key.id === proof.key?.id && normalizedPasskeyPublicKey(key.publicKey) === proof.key.publicKey))) throw new SigninPolicyError();
	if (proof.mode === 'passwordless') {
		if (policy.independentPasskeyEnabled || !profile.usePasswordLessLogin || proof.factor !== 'passkey' || !proof.key) throw new SigninPolicyError();
		return;
	}
	if (!proof.passwordVerified || !profile.password) throw new SigninPolicyError();
	if (!policy.required && proof.factor === 'none') return;
	if (proof.factor === 'totp' && policy.totp) return;
	if (proof.factor === 'recovery' && policy.required) return;
	if (proof.factor === 'passkey' && policy.passkey && proof.key) return;
	throw new SigninPolicyError();
}
