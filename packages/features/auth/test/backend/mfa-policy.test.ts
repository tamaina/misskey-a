/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { assertLegacyMfaManagement, assertMfaFactorRetained, assertPasswordRecoveryPossible, assertSameMfaPolicy, readMfaPolicy } from '../../backend/mfa-policy.js';
import type { MfaPolicySnapshot } from '../../backend/mfa-policy.js';

const inactive: MfaPolicySnapshot = { userId: 'synthetic', password: 'synthetic-hash', twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: false };

test.each([0, 1, 3])('orphan registered keys never enable MFA (%s)', keyCount => {
	expect(readMfaPolicy(inactive, keyCount)).toEqual({ required: false, totp: false, passkey: false, independentPasskeyEnabled: false });
});

test('legacy TOTP retains passkey fallback without enabling independent policy', () => {
	expect(readMfaPolicy({ ...inactive, twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret' }, 1)).toEqual({ required: true, totp: true, passkey: true, independentPasskeyEnabled: false });
});

test('explicit independent policy requires MFA even with no available key', () => {
	const enabled = { ...inactive, passkeyMfaEnabled: true };
	expect(readMfaPolicy(enabled, 0)).toEqual({ required: true, totp: false, passkey: false, independentPasskeyEnabled: true });
	expect(() => assertMfaFactorRetained(enabled, 0)).toThrow('authentication failed');
	expect(() => assertMfaFactorRetained(enabled, 1)).not.toThrow();
	const withRecoveryCode = { ...enabled, twoFactorBackupSecret: ['synthetic-backup'] };
	expect(() => assertMfaFactorRetained(withRecoveryCode, 0)).toThrow('authentication failed');
});

test('a retained TOTP factor permits the last passkey removal', () => {
	expect(() => assertMfaFactorRetained({ ...inactive, passkeyMfaEnabled: true, twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret' }, 0)).not.toThrow();
});

test('an enabled TOTP flag without a secret is not an available factor', () => {
	expect(() => assertMfaFactorRetained({ ...inactive, twoFactorEnabled: true }, 0)).toThrow('authentication failed');
});

test.each([-1, 0.5, Infinity, NaN])('invalid factor count fails closed (%s)', count => {
	expect(() => readMfaPolicy(inactive, count)).toThrow('Invalid MFA factor count');
});

test('legacy management cannot substitute for independent-MFA fresh reauthentication', () => {
	expect(() => assertLegacyMfaManagement(inactive)).not.toThrow();
	expect(() => assertLegacyMfaManagement({ ...inactive, passkeyMfaEnabled: true })).toThrow('authentication failed');
});

test.each([null, ''])('all-factor recovery requires an existing password (%s)', password => {
	expect(() => assertPasswordRecoveryPossible({ ...inactive, password })).toThrow('authentication failed');
});

test.each(['userId', 'password', 'twoFactorSecret', 'twoFactorEnabled', 'passkeyMfaEnabled'] as const)('changed %s invalidates the earlier management proof', field => {
	const changed = { ...inactive, [field]: field.endsWith('Enabled') ? true : 'changed-synthetic' };
	expect(() => assertSameMfaPolicy(inactive, changed)).toThrow('authentication failed');
});

test('recovery-code consumption does not invalidate its own credential policy snapshot', () => {
	const before = { ...inactive, twoFactorBackupSecret: ['synthetic-backup', 'keep'] };
	const after = { ...inactive, twoFactorBackupSecret: ['keep'] };
	expect(() => assertSameMfaPolicy(before, after)).not.toThrow();
	expect(() => assertPasswordRecoveryPossible(inactive)).not.toThrow();
});
