/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { parseEnvelopeRecipient, readBoundedMailData, authenticateMailDelivery, mailDeliverySigningPayload } from '../../../backend/built/features/email/backend.js';

test('envelope addresses require exact domain and preserve plus suffix and original recipient', () => {
	assert.deepEqual(parseEnvelopeRecipient('Alice+tag@MAIL.EXAMPLE', 'mail.example'), { username: 'alice', suffix: 'tag', address: 'Alice+tag@MAIL.EXAMPLE' });
	assert.equal(parseEnvelopeRecipient('alice@mail.example', 'mail.example').suffix, null);
	for (const address of ['alice@other.example', 'alice@mail.example.evil', '<alice@mail.example>', 'alice+@mail.example', 'alice\n@mail.example', '"alice"@mail.example', 'alice+a+b@mail.example']) {
		assert.throws(() => parseEnvelopeRecipient(address, 'mail.example'));
	}
});

test('DATA reader enforces actual bytes, SMTP overflow flag and interrupted streams', async () => {
	async function* data() { yield Buffer.from('abc'); yield Buffer.from('d'); }

	assert.equal((await readBoundedMailData(data(), 4)).toString(), 'abcd');
	await assert.rejects(readBoundedMailData(data(), 3), /TOO_LARGE/);
	await assert.rejects(readBoundedMailData(Object.assign(data(), { sizeExceeded: true }), 100), /TOO_LARGE/);

	async function* broken() { yield Buffer.from('a'); throw new Error('disconnect'); }

	await assert.rejects(readBoundedMailData(broken(), 100), /disconnect/);
});

test('MTA signature binds stable delivery ID, raw bytes, envelope and timestamp', () => {
	const raw = Buffer.from('Message-ID: <spoofable>\r\n\r\nbody');
	const secret = 'a'.repeat(32);
	const envelope = { deliveryId: 'stable_mta_queue_id_123', timestamp: 1000, mailFrom: 'sender@example.com', recipients: ['alice@mail.example'] };
	const sign = e => createHmac('sha256', secret).update(mailDeliverySigningPayload(raw, e)).digest('hex');
	authenticateMailDelivery(raw, envelope, sign(envelope), secret, 1000);
	assert.throws(() => authenticateMailDelivery(raw, envelope, sign(envelope), secret, 1301), /UNAUTHENTICATED/);
	assert.throws(() => authenticateMailDelivery(Buffer.from('different'), envelope, sign(envelope), secret, 1000), /UNAUTHENTICATED/);
	assert.throws(() => authenticateMailDelivery(raw, { ...envelope, recipients: ['bob@mail.example'] }, sign(envelope), secret, 1000), /UNAUTHENTICATED/);
	assert.throws(() => authenticateMailDelivery(raw, envelope, 'bad', secret, 1000), /UNAUTHENTICATED/);
	const retry = { ...envelope, timestamp: 2000 };
	authenticateMailDelivery(raw, retry, sign(retry), secret, 2000);
});
