/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** The authentication transport's invalid-credential error, not a failed factor proof. */
export function isInvalidCredential(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	return 'code' in error && error.code === 'AUTHENTICATION_FAILED'
		&& 'id' in error && error.id === 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14';
}
