/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isoCBOR } from '@simplewebauthn/server/helpers';

/** Existing legacy P-256 uncompressed point representation, normalized to COSE.
 * Keep this pure so a policy stamp remains stable across representation migration.
 */
export function normalizedPasskeyPublicKey(publicKey: string): string {
	if (publicKey.length !== 87) return publicKey;
	const point = new Uint8Array(Buffer.from(publicKey, 'base64url'));
	if (point.length !== 65 || point[0] !== 0x04) return publicKey;
	return Buffer.from(isoCBOR.encode(new Map<number, number | Uint8Array>([
		[1, 2], [3, -7], [-1, 1], [-2, point.slice(1, 33)], [-3, point.slice(33)],
	]))).toString('base64url');
}
