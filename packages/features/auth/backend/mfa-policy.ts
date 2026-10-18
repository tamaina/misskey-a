/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { MiUserProfile } from '@features/users/backend/models/UserProfile.js';

export type MfaPolicySnapshot = Pick<MiUserProfile, 'userId' | 'password' | 'twoFactorEnabled' | 'twoFactorSecret' | 'passkeyMfaEnabled'> & Partial<Pick<MiUserProfile, 'usePasswordLessLogin' | 'passwordLoginDisabled'>>;

/** Policy and available factors are distinct; neither keys nor recovery codes activate MFA. */
export function readMfaPolicy(profile: MfaPolicySnapshot, keyCount: number) {
	if (!Number.isSafeInteger(keyCount) || keyCount < 0) throw new Error('Invalid MFA factor count');
	const totpEnabled = profile.twoFactorEnabled === true;
	const independentPasskeyEnabled = profile.passkeyMfaEnabled === true;
	return {
		required: totpEnabled || independentPasskeyEnabled,
		totp: totpEnabled && typeof profile.twoFactorSecret === 'string' && profile.twoFactorSecret.length > 0,
		// Preserve existing TOTP-enabled passkey fallback without promoting orphan keys.
		passkey: (totpEnabled || independentPasskeyEnabled) && keyCount > 0,
		independentPasskeyEnabled,
	};
}

/** A factor removal cannot silently turn required MFA into password-only access. */
export function assertMfaFactorRetained(profile: MfaPolicySnapshot, remainingKeyCount: number) {
	const policy = readMfaPolicy(profile, remainingKeyCount);
	if ((profile.passwordLoginDisabled === true && remainingKeyCount === 0) || (policy.required && !policy.totp && !policy.passkey)) throw new Error('authentication failed');
}

/** Old password/TOTP management proofs are not independent-MFA fresh-auth grants. */
export function assertLegacyMfaManagement(profile: MfaPolicySnapshot & Partial<Pick<MiUserProfile, 'passwordLoginDisabled'>>) {
	if (profile.passkeyMfaEnabled === true || profile.passwordLoginDisabled === true) throw new Error('authentication failed');
}

export function assertPasswordRecoveryPossible(profile: MfaPolicySnapshot & Partial<Pick<MiUserProfile, 'passwordLoginDisabled'>>) {
	if (profile.passwordLoginDisabled === true || typeof profile.password !== 'string' || profile.password.length === 0) throw new Error('authentication failed');
}

/** Backup-code consumption intentionally changes the array, not this credential policy. */
export function assertSameMfaPolicy(expected: MfaPolicySnapshot, current: MfaPolicySnapshot) {
	if (expected.userId !== current.userId || (expected.password ?? null) !== (current.password ?? null)
		|| (expected.twoFactorSecret ?? null) !== (current.twoFactorSecret ?? null)
		|| (expected.twoFactorEnabled === true) !== (current.twoFactorEnabled === true)
		|| (expected.passkeyMfaEnabled === true) !== (current.passkeyMfaEnabled === true)
		|| (expected.usePasswordLessLogin === true) !== (current.usePasswordLessLogin === true)
		|| (expected.passwordLoginDisabled === true) !== (current.passwordLoginDisabled === true)) throw new Error('authentication failed');
}
