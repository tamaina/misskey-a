/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isoCBOR } from '@simplewebauthn/server/helpers';

/** The existing legacy EC2/P-256 conversion; equivalent key representations share a policy stamp. */
export function canonicalWebAuthnPublicKey(publicKey: string, counter: number): string {
	if (counter !== 0 || publicKey.length !== 87) return publicKey;
	const cert = new Uint8Array(Buffer.from(publicKey, 'base64url'));
	if (cert[0] !== 0x04) return publicKey;
	const halfLength = (cert.length - 1) / 2;
	const cborMap = new Map<number, number | Uint8Array>();
	cborMap.set(1, 2); // kty, EC2
	cborMap.set(3, -7); // alg, ES256
	cborMap.set(-1, 1); // crv, P256
	cborMap.set(-2, cert.slice(1, halfLength + 1)); // x
	cborMap.set(-3, cert.slice(halfLength + 1)); // y
	return Buffer.from(isoCBOR.encode(cborMap)).toString('base64url');
}
