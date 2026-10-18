/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { canonicalWebAuthnPublicKey } from './webauthn-public-key.js';
import type { AuthenticationProgressBinding, AuthenticationProgressStep, AuthenticationProgressStore } from './authentication-progress-store.js';
import type { SigninProgressChallenge } from './signin-progress.schema.js';

export type SigninProgressStorage = Pick<AuthenticationProgressStore, 'startDeadline' | 'remaining' | 'create' | 'advance' | 'read' | 'claim' | 'finishClaim' | 'consume' | 'cancel'>;
const stamp = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Credentials are hashed into a policy version, never persisted as state facts. */
export function signinProgressBinding(value: {
	userId: string; origin: string; rpId: string;
	captcha: boolean[]; passwordHash: string | null; totpEnabled: boolean;
	totpSecret: string | null; passwordless: boolean; independentPasskey?: boolean; passwordLoginDisabled?: boolean; nativeToken?: string | null;
	keys: { id: string; publicKey: string; counter?: number }[];
}): AuthenticationProgressBinding {
	return {
		purpose: { kind: 'signin' }, userId: value.userId,
		globalPolicyStamp: stamp({ version: 2, origin: value.origin, rpId: value.rpId, uv: 'second-factor-preferred', captcha: value.captcha }),
		userPolicyStamp: stamp({ passwordHash: value.passwordHash, totpEnabled: value.totpEnabled, totpSecret: value.totpSecret,
			passwordless: value.passwordless, independentPasskey: value.independentPasskey === true, passwordLoginDisabled: value.passwordLoginDisabled === true, nativeToken: value.nativeToken ?? null, keys: value.keys.map(key => ({ id: key.id, publicKey: canonicalWebAuthnPublicKey(key.publicKey, key.counter ?? -1) })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }),
	};
}

export class SigninProgressController {
	constructor(private store: SigninProgressStorage) {}

	/** Called only after the current request has verified the password. */
	async begin(context: AuthenticationProgressBinding, expiresAt?: number): Promise<SigninProgressChallenge> {
		if (context.purpose.kind !== 'signin' || context.userId === null || context.userPolicyStamp === null) throw new Error('Invalid signin progress binding');
		const start = await this.store.create(context, expiresAt ?? await this.store.startDeadline());
		const next = await this.store.advance(context, start, start, {
			verifiedForUserId: context.userId!, userPolicyStamp: context.userPolicyStamp!, factor: 'password',
		});
		if (!next) {
			await this.store.cancel(context, start, start);
			throw new Error('Authentication progress unavailable');
		}
		return { ticket: start.ticket, browserSecret: start.browserSecret, nonce: next.nonce, version: next.version };
	}

	async resume(context: AuthenticationProgressBinding, challenge: SigninProgressChallenge): Promise<boolean> {
		const pending = await this.store.read(context, challenge, challenge);
		return pending?.state === 'active' && pending.facts.password !== undefined && (await this.store.remaining(context, challenge)) !== null;
	}

	/** claim precedes backup-code/WebAuthn consumption; only its private nonce owns the verifier. */
	async finish(context: AuthenticationProgressBinding, challenge: SigninProgressChallenge, factor: 'totp' | 'passkey',
		verify: () => Promise<boolean>, current: () => Promise<AuthenticationProgressBinding | null>, acceptDeadline?: (deadline: number) => void): Promise<boolean> {
		if (context.purpose.kind !== 'signin' || context.userId === null || context.userPolicyStamp === null) return false;
		const started = performance.now();
		const remaining = await this.store.remaining(context, challenge);
		if (remaining === null) return false;
		const deadline = started + remaining;
		const pending = await this.store.read(context, challenge, challenge);
		if (!pending || pending.state !== 'active' || pending.facts.password === undefined) return false;
		let owner: AuthenticationProgressStep | undefined;
		try {
			const claimed = await this.store.claim(context, challenge, challenge);
			if (!claimed) return false;
			owner = claimed;
			if (performance.now() >= deadline || !await verify() || performance.now() >= deadline) return false;
			const fresh = await current();
			if (!fresh || JSON.stringify(fresh) !== JSON.stringify(context)) return false;
			const completed = await this.store.finishClaim(context, challenge, owner, {
				verifiedForUserId: context.userId!, userPolicyStamp: context.userPolicyStamp!, factor,
			});
			if (!completed) return false;
			owner = completed;
			const consumed = await this.store.consume(context, challenge, owner);
			const accepted = performance.now() < deadline && consumed?.facts.password !== undefined && consumed.facts[factor] !== undefined;
			if (accepted) acceptDeadline?.(deadline);
			return accepted;
		} finally {
			if (owner) await this.store.cancel(context, challenge, owner);
		}
	}
}
