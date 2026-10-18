/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as v from 'valibot';
import { SigninProgressController, signinProgressBinding, type SigninProgressStorage } from '../../backend/signin-progress.js';
import { signinProgressChallengeSchema } from '../../backend/signin-progress.schema.js';
import type { AuthenticationProgressMetadata } from '../../backend/authentication-progress-store.js';

const policy = { userId: 'synthetic', origin: 'https://synthetic.example', rpId: 'synthetic.example', captcha: [false], passwordHash: 'synthetic-password-hash', totpEnabled: true, totpSecret: 'synthetic-secret', passwordless: false, keys: [{ id: 'key2', publicKey: 'public2' }, { id: 'key1', publicKey: 'public1' }] };
const context = signinProgressBinding(policy);
const challenge = { ticket: 't'.repeat(43), browserSecret: 'b'.repeat(43), nonce: 'n'.repeat(43), version: 1 };
const metadata: AuthenticationProgressMetadata = { ...context, version: 1, state: 'active', createdAt: 1, facts: { password: 1 } };

function harness() {
	const store = mockDeep<SigninProgressStorage>(); store.remaining.mockResolvedValue(90_000); store.startDeadline.mockResolvedValue(Date.now() + 90_000);
	store.read.mockResolvedValue(metadata);
	store.claim.mockResolvedValue({ nonce: 'o'.repeat(43), version: 2, metadata: { ...metadata, state: 'claimed' } });
	store.finishClaim.mockResolvedValue({ nonce: 'f'.repeat(43), version: 3, metadata: { ...metadata, state: 'claimed', facts: { password: 1, totp: 2, passkey: 2 } } });
	store.consume.mockResolvedValue({ ...metadata, state: 'claimed', facts: { password: 1, totp: 2, passkey: 2 } });
	store.cancel.mockResolvedValue(false);
	return { store, controller: new SigninProgressController(store) };
}

test('policy fingerprints sensitive changes without persisting credentials and is stable for key order', () => {
	expect(signinProgressBinding({ ...policy, keys: [...policy.keys].reverse() })).toEqual(context);
	for (const changed of [{ passwordHash: 'changed' }, { totpSecret: 'changed' }, { totpEnabled: false }, { passwordless: true }, { keys: [] }]) expect(signinProgressBinding({ ...policy, ...changed }).userPolicyStamp).not.toBe(context.userPolicyStamp);
	expect(signinProgressBinding({ ...policy, origin: 'https://other.example' }).globalPolicyStamp).not.toBe(context.globalPolicyStamp);
	for (const secret of [policy.passwordHash, policy.totpSecret]) expect(JSON.stringify(context)).not.toContain(secret);
});
test('protocol rejects extra facts and unsafe versions', () => {
	expect(v.parse(signinProgressChallengeSchema, challenge)).toEqual(challenge);
	for (const changed of [{ nonce: 'wrong' }, { version: -1 }, { version: 0.5 }, { version: Infinity }, { version: Number.MAX_SAFE_INTEGER + 1 }, { password: 'secret' }]) expect(() => v.parse(signinProgressChallengeSchema, { ...challenge, ...changed })).toThrow();
});
test('claim precedes verifier, private owner finishes and current policy precedes consume', async () => {
	const h = harness(); const order: string[] = [];
	h.store.claim.mockImplementation(async () => { order.push('claim'); return { nonce: 'o'.repeat(43), version: 2, metadata: { ...metadata, state: 'claimed' } }; });
	h.store.consume.mockImplementation(async () => { order.push('consume'); return { ...metadata, state: 'claimed', facts: { password: 1, totp: 2 } }; });
	expect(await h.controller.finish(context, challenge, 'totp', async () => { order.push('verify'); return true; }, async () => { order.push('policy'); return context; })).toBe(true);
	expect(order).toEqual(['claim', 'verify', 'policy', 'consume']);
	expect(h.store.finishClaim).toHaveBeenCalledWith(context, challenge, expect.objectContaining({ nonce: 'o'.repeat(43) }), { verifiedForUserId: 'synthetic', userPolicyStamp: context.userPolicyStamp, factor: 'totp' });
	expect(h.store.cancel).toHaveBeenCalledWith(context, challenge, expect.objectContaining({ nonce: 'f'.repeat(43) }));
});
test('one competing owner alone reaches consumable verification', async () => {
	const h = harness(); let reserved = false;
	h.store.claim.mockImplementation(async () => { if (reserved) return null; reserved = true; return { nonce: 'o'.repeat(43), version: 2, metadata: { ...metadata, state: 'claimed' } }; });
	const verify = vi.fn(async () => true);
	const results = await Promise.all([h.controller.finish(context, challenge, 'totp', verify, async () => context), h.controller.finish(context, challenge, 'totp', verify, async () => context)]);
	expect(results.filter(Boolean)).toHaveLength(1); expect(verify).toHaveBeenCalledOnce();
});
test.each(['missing', 'no-password', 'claimed', 'lost-claim'] as const)('rejects %s before verification', async scenario => {
	const h = harness(); const verify = vi.fn(async () => true);
	if (scenario === 'missing') h.store.read.mockResolvedValue(null);
	if (scenario === 'no-password') h.store.read.mockResolvedValue({ ...metadata, facts: {} });
	if (scenario === 'claimed') h.store.read.mockResolvedValue({ ...metadata, state: 'claimed' });
	if (scenario === 'lost-claim') h.store.claim.mockResolvedValue(null);
	expect(await h.controller.finish(context, challenge, 'passkey', verify, async () => context)).toBe(false); expect(verify).not.toHaveBeenCalled(); expect(h.store.consume).not.toHaveBeenCalled();
});
test.each(['false', 'throws', 'policy', 'disabled', 'finish', 'expired'] as const)('fails closed and cancels private owner on %s', async scenario => {
	const h = harness(); if (scenario === 'finish') h.store.finishClaim.mockResolvedValue(null); if (scenario === 'expired') h.store.consume.mockResolvedValue(null);
	const run = h.controller.finish(context, challenge, 'totp', async () => { if (scenario === 'throws') throw new Error('synthetic failure'); return scenario !== 'false'; }, async () => scenario === 'disabled' ? null : scenario === 'policy' ? signinProgressBinding({ ...policy, totpSecret: 'changed' }) : context);
	if (scenario === 'throws') await expect(run).rejects.toThrow('synthetic failure'); else expect(await run).toBe(false);
	expect(h.store.cancel).toHaveBeenCalledOnce();
});

test('signin controller refuses anonymous or non-signin purposes before touching state', async () => {
	const h = harness(); const verify = vi.fn(async () => true);
	for (const changed of [{ ...context, userId: null, userPolicyStamp: null }, { ...context, purpose: { kind: 'sudo' as const, userId: 'synthetic', sessionId: 'session' } }]) {
		await expect(h.controller.begin(changed)).rejects.toThrow();
		expect(await h.controller.finish(changed, challenge, 'totp', verify, async () => context)).toBe(false);
	}
	expect(h.store.create).not.toHaveBeenCalled(); expect(h.store.read).not.toHaveBeenCalled(); expect(verify).not.toHaveBeenCalled();
});

test('continuation deadline is bounded by the original Redis TTL and verifier delay cannot refresh it', async () => {
	const h = harness(); h.store.remaining.mockResolvedValue(50); const accepted = vi.fn(); const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
	expect(await h.controller.finish(context, challenge, 'totp', async () => { clock.mockReturnValue(1050); return true; }, async () => context, accepted)).toBe(false);
	expect(h.store.consume).not.toHaveBeenCalled(); expect(accepted).not.toHaveBeenCalled(); clock.mockRestore();
});
test('remaining TTL bounds the final transaction deadline', async () => {
	const h = harness(); h.store.remaining.mockResolvedValue(500); const clock = vi.spyOn(performance, 'now').mockReturnValue(1000); const accepted = vi.fn();
	expect(await h.controller.finish(context, challenge, 'totp', async () => true, async () => context, accepted)).toBe(true); expect(accepted).toHaveBeenCalledWith(1500); clock.mockRestore();
});
