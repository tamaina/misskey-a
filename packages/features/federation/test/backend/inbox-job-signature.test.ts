/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { UnrecoverableError } from 'bullmq';
import { verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import type { ParsedDraftSignature, ParsedRFC9421Signature } from '@misskey-dev/node-http-message-signatures';
import { normalizeInboxJobSignature } from '../../backend/utility/inbox-job-signature.js';

const keyId = 'https://sender.example/users/alice#main-key';
const signingString = '(request-target): post /inbox\nhost: receiver.example\ndate: Sat, 10 Oct 2026 00:00:00 GMT\ndigest: SHA-256=synthetic';

describe('retained inbox signature formats', () => {
	test.each(['rsa', 'ed25519'] as const)('verifies JSON serialized flat and wrapped %s jobs without changing signed fields', async algorithm => {
		const keys = algorithm === 'rsa' ? generateKeyPairSync('rsa', { modulusLength: 2048 }) : generateKeyPairSync('ed25519');
		const encoded = sign(algorithm === 'rsa' ? 'sha256' : null, Buffer.from(signingString), keys.privateKey).toString('base64');
		const value: ParsedDraftSignature['value'] = {
			scheme: 'Signature',
			params: { keyId, algorithm: algorithm === 'rsa' ? 'rsa-sha256' : 'hs2019', headers: ['(request-target)', 'host', 'date', 'digest'], signature: encoded },
			algorithm: algorithm === 'rsa' ? 'RSA-SHA256' : undefined,
			keyId,
			signingString,
		};
		const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		for (const signature of [value, { version: 'draft', value }]) {
			const job = JSON.parse(JSON.stringify({ activity: { type: 'Update', actor: 'https://sender.example/users/alice' }, signature }));
			const normalized = normalizeInboxJobSignature(job.signature);
			expect(normalized).toEqual(JSON.parse(JSON.stringify(value)));
			expect(normalized?.keyId.toLowerCase()).toBe(keyId);
			expect(await verifyDraftSignature(normalized!, publicKey)).toBe(true);
			expect(await verifyDraftSignature({ ...normalized!, signingString: signingString + 'tampered' }, publicKey)).toBe(false);
		}
	});

	test('preserves the existing unsigned job path', () => {
		expect(normalizeInboxJobSignature(null)).toBeNull();
		expect(normalizeInboxJobSignature(undefined)).toBeNull();
	});

	test('explicitly rejects retained RFC9421 jobs before draft verification', () => {
		const signature: ParsedRFC9421Signature = { version: 'rfc9421', value: [] };
		expect(() => normalizeInboxJobSignature(JSON.parse(JSON.stringify(signature)))).toThrow(UnrecoverableError);
		expect(() => normalizeInboxJobSignature(signature)).toThrow('RFC9421 HTTP Message Signatures are not supported');
	});
});
