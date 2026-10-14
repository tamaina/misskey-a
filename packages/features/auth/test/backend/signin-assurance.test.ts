/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { performance } from 'node:perf_hooks';
import { expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { assertCurrentSigninAssurance, assertSigninDeadline, consumeSigninAssurance, createSigninAssurance, signinPolicyStamp } from '../../backend/signin-assurance.js';
import type { SigninAssurance } from '../../backend/signin-assurance.js';

function fixture(profileChanges: Partial<MiUserProfile> = {}) {
	const user = mock<MiUser>({ id: 'synthetic', token: 'synthetic-master', host: null, isSuspended: false, isDeleted: false });
	const profile = Object.assign(new MiUserProfile({}), { userId: user.id, password: 'synthetic-hash', twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false, usePasswordLessLogin: false, twoFactorBackupSecret: ['synthetic-recovery'], ...profileChanges });
	const keys = [mock<MiUserSecurityKey>({ id: 'AQID', userId: user.id, publicKey: 'AQID', counter: 1 })];
	const deadline = performance.now() + 90_000;
	const proof = (changes: Partial<Parameters<typeof createSigninAssurance>[0]> = {}) => createSigninAssurance({ userId: user.id, policyStamp: signinPolicyStamp(user, profile, keys), mode: 'password', passwordVerified: true, factor: 'passkey', key: { userId: user.id, id: keys[0].id, publicKey: keys[0].publicKey, deadline }, deadline, ...changes });
	return { user, profile, keys, deadline, proof };
}

test('owned current password/UV proof is immutable, server-only and consumed once', () => {
	const f = fixture(); const proof = f.proof();
	expect(Object.isFrozen(proof)).toBe(true); expect(Object.isFrozen(proof.key)).toBe(true);
	expect(() => consumeSigninAssurance(JSON.parse(JSON.stringify(proof)) as SigninAssurance, f.user.id)).toThrow('authentication failed');
	consumeSigninAssurance(proof, f.user.id);
	expect(() => assertCurrentSigninAssurance(proof, f.user, f.profile, f.keys)).not.toThrow();
	expect(() => consumeSigninAssurance(proof, f.user.id)).toThrow('authentication failed');
});

test.each([
	{ password: 'changed' }, { twoFactorSecret: 'changed' }, { twoFactorEnabled: false },
	{ passkeyMfaEnabled: true }, { usePasswordLessLogin: true },
])('original expectation rejects credential policy changes %j', changes => {
	const f = fixture(); const proof = f.proof(); Object.assign(f.profile, changes);
	expect(() => assertCurrentSigninAssurance(proof, f.user, f.profile, f.keys)).toThrow('authentication failed');
});

test.each(['token', 'isSuspended', 'isDeleted', 'host'] as const)('current account %s is checked at issuance', field => {
	const f = fixture(); const proof = f.proof();
	Object.assign(f.user, { [field]: field === 'token' ? 'regenerated' : field === 'host' ? 'remote.example' : true });
	expect(() => assertCurrentSigninAssurance(proof, f.user, f.profile, f.keys)).toThrow();
});

test.each(['remove', 'material', 'owner', 'addition'] as const)('key-set change %s invalidates the pre-proof expectation', change => {
	const f = fixture(); const proof = f.proof();
	if (change === 'remove') f.keys.length = 0;
	else if (change === 'material') f.keys[0].publicKey = 'BAUG';
	else if (change === 'owner') f.keys[0].userId = 'other';
	else f.keys.push(mock<MiUserSecurityKey>({ id: 'other', userId: f.user.id, publicKey: 'BAUG' }));
	expect(() => assertCurrentSigninAssurance(proof, f.user, f.profile, f.keys)).toThrow();
});

test('counter/last-used/name and consumed recovery stock do not change policy', () => {
	const f = fixture(); const proof = f.proof();
	f.keys[0].counter++; f.keys[0].name = 'renamed'; f.keys[0].lastUsed = new Date(); f.profile.twoFactorBackupSecret = [];
	expect(() => assertCurrentSigninAssurance(proof, f.user, f.profile, f.keys)).not.toThrow();
});

test('orphan keys and backup stock never activate MFA on password-only accounts', () => {
	const f = fixture({ twoFactorEnabled: false, twoFactorSecret: null });
	expect(() => assertCurrentSigninAssurance(f.proof({ factor: 'none', key: undefined }), f.user, f.profile, f.keys)).not.toThrow();
	const required = fixture({ passkeyMfaEnabled: true });
	expect(() => assertCurrentSigninAssurance(required.proof({ factor: 'none', key: undefined }), required.user, required.profile, required.keys)).toThrow();
});

test('independent policy needs password and an available second factor; disabled TOTP cannot substitute', () => {
	const f = fixture({ passkeyMfaEnabled: true, twoFactorEnabled: false, twoFactorSecret: null, usePasswordLessLogin: true });
	expect(() => assertCurrentSigninAssurance(f.proof({ mode: 'passwordless', passwordVerified: false }), f.user, f.profile, f.keys)).toThrow();
	expect(() => assertCurrentSigninAssurance(f.proof({ passwordVerified: false }), f.user, f.profile, f.keys)).toThrow();
	expect(() => assertCurrentSigninAssurance(f.proof({ factor: 'totp', key: undefined }), f.user, f.profile, f.keys)).toThrow();
	expect(() => assertCurrentSigninAssurance(f.proof(), f.user, f.profile, f.keys)).not.toThrow();
	const recovery = f.proof({ factor: 'recovery', key: undefined }); f.profile.twoFactorBackupSecret = [];
	expect(() => assertCurrentSigninAssurance(recovery, f.user, f.profile, f.keys)).not.toThrow();
});

test('legacy enabled passwordless remains available only with an owned UV key', () => {
	const f = fixture({ usePasswordLessLogin: true });
	expect(() => assertCurrentSigninAssurance(f.proof({ mode: 'passwordless', passwordVerified: false }), f.user, f.profile, f.keys)).not.toThrow();
	expect(() => assertCurrentSigninAssurance(f.proof({ mode: 'passwordless', factor: 'totp', key: undefined }), f.user, f.profile, f.keys)).toThrow();
});

test('the earlier key deadline wins, expired proof is burned and cannot be restored', () => {
	const f = fixture(); const proof = f.proof({ key: { userId: f.user.id, id: 'AQID', publicKey: 'AQID', deadline: f.deadline - 10_000 } });
	expect(proof.deadline).toBe(f.deadline - 10_000);
	const clock = vi.spyOn(performance, 'now').mockReturnValue(proof.deadline);
	expect(() => assertSigninDeadline(proof)).toThrow(); expect(() => consumeSigninAssurance(proof, f.user.id)).toThrow();
	clock.mockRestore(); expect(() => consumeSigninAssurance(proof, f.user.id)).toThrow();
});

test('enabled TOTP remains an alternative when independent passkey policy is enabled', () => {
	const f = fixture({ passkeyMfaEnabled: true });
	expect(() => assertCurrentSigninAssurance(f.proof({ factor: 'totp', key: undefined }), f.user, f.profile, f.keys)).not.toThrow();
});
