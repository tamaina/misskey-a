/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { createMailIngress, resolveUserMailConfig, parseMailIsolated, readMailAttachmentIsolated, mailDeliverySigningPayload, MailStore, MailStoreError } from '../../../backend/built/features/email/backend.js';

const config = {
	enabled: true, domain: 'mail.example.org', mxHost: 'mx.example.org', s3: { bucket: 'private-mail', region: 'eu-west-1' },
	ingress: { token: 'a'.repeat(32), secret: 'b'.repeat(32) },
};

async function launchIngress(t, store) {
	const server = createMailIngress(resolveUserMailConfig({ ...config, maxBytes: 1000 }), store);
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
	t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
	return `http://127.0.0.1:${server.address().port}/v1/deliver`;
}

function signedHeaders(raw, envelope) {
	return {
		authorization: `Bearer ${config.ingress.token}`,
		'x-mail-envelope': Buffer.from(JSON.stringify(envelope)).toString('base64url'),
		'x-mail-signature': createHmac('sha256', config.ingress.secret).update(mailDeliverySigningPayload(raw, envelope)).digest('hex'),
	};
}

test('user mail defaults disabled and rejects unsafe ingress/storage/limits', () => {
	assert.equal(resolveUserMailConfig(), null);
	assert.equal(resolveUserMailConfig({ enabled: false }), null);
	assert.equal(resolveUserMailConfig(config).maxBytes, 25 * 1024 * 1024);
	assert.throws(() => resolveUserMailConfig({ ...config, ingress: { ...config.ingress, host: '0.0.0.0' } }));
	assert.throws(() => resolveUserMailConfig({ ...config, ingress: { ...config.ingress, secret: config.ingress.token } }));
	assert.throws(() => resolveUserMailConfig({ ...config, forwarding: { enabled: true, trustedIngress: true, loopChecked: true, forwardingRelay: true } }));
	assert.throws(() => resolveUserMailConfig({ ...config, maxBytes: 26 * 1024 * 1024 }));
	assert.throws(() => resolveUserMailConfig({ ...config, s3: { ...config.s3, endpoint: 'http://storage.invalid' } }));
});

test('private ingress authenticates first and reports durable per-recipient outcomes', async t => {
	const calls = [];
	const store = {
		async findReceipts(id, recipients, sha256, sender) { calls.push(['receipts', id, recipients, sha256, sender]); return new Map(); },
		async stage(raw) { calls.push(['stage', raw.toString()]); return { id: 'raw' }; },
		async accept(raw, deliveryId, recipient) {
			calls.push(['accept', raw, deliveryId, recipient]);
			if (recipient === 'missing@mail.example.org') throw new MailStoreError('RECIPIENT_UNAVAILABLE');
			if (recipient === 'full@mail.example.org') throw new MailStoreError('QUOTA_EXCEEDED');
			return { id: 'receipt', duplicate: false };
		},
	};
	const url = await launchIngress(t, store);
	assert.equal((await fetch(url, { method: 'POST', body: 'raw' })).status, 401);
	assert.equal(calls.length, 0);
	const raw = Buffer.from('From: outside@example.net\r\nSubject: test\r\n\r\nhello');
	const envelope = { deliveryId: 'persisted-delivery-id', timestamp: Math.floor(Date.now() / 1000), mailFrom: 'outside@example.net', recipients: ['alice@mail.example.org', 'missing@mail.example.org', 'full@mail.example.org'] };
	const headers = signedHeaders(raw, envelope);
	const rejected = await fetch(url, { method: 'POST', headers: { ...headers, 'x-mail-signature': '0'.repeat(64) }, body: raw });
	assert.equal(rejected.status, 400);
	assert.equal(calls.length, 0);
	const response = await fetch(url, { method: 'POST', headers, body: raw });
	assert.equal(response.status, 200);
	assert.deepEqual((await response.json()).results.map(result => result.code), [250, 550, 451]);
	assert.deepEqual(calls[0], ['receipts', envelope.deliveryId, envelope.recipients, createHash('sha256').update(raw).digest('hex'), envelope.mailFrom]);
	assert.equal(calls[1][0], 'stage');
	assert.equal(calls.length, 5);
	assert.equal((await fetch(url, { method: 'POST', headers, body: 'x'.repeat(1001) })).status, 413);
	assert.equal(calls.length, 5);
});

test('committed receipts are authenticated without new staging or current mailbox eligibility', async t => {
	const raw = Buffer.from('Subject: synthetic fixture\r\n\r\nbody');
	const accepted = 'prior@mail.example.org';
	const fresh = 'new@mail.example.org';
	const envelope = { deliveryId: 'persisted-delivery-id', timestamp: Math.floor(Date.now() / 1000), mailFrom: 'sender@example.net', recipients: [accepted] };
	const receipt = { recipient: accepted, envelopeFrom: envelope.mailFrom, sha256: createHash('sha256').update(raw).digest('hex') };
	let committed = true;
	let stageCalls = 0;
	const store = new MailStore({
		async query(sql, [id, recipients]) {
			assert.match(sql, /FROM "mail_delivery"/);
			return committed && id === envelope.deliveryId && recipients.includes(accepted) ? [receipt] : [];
		},
	}, {}, config.domain, 1000n);
	store.stage = async () => { stageCalls++; throw new MailStoreError('QUOTA_EXCEEDED'); };
	store.accept = async () => assert.fail('No recipient should be accepted twice or without staged bytes');
	const url = await launchIngress(t, store);
	const deliver = async (rawBytes = raw, fields = {}) => {
		const message = { ...envelope, ...fields };
		const response = await fetch(url, { method: 'POST', headers: signedHeaders(rawBytes, message), body: rawBytes });
		return { status: response.status, body: await response.json() };
	};

	assert.deepEqual(await deliver(), { status: 200, body: { results: [{ recipient: accepted, code: 250 }] } });
	assert.deepEqual(await deliver(Buffer.from('Subject: different synthetic receipt')), { status: 200, body: { results: [{ recipient: accepted, code: 550 }] } });
	assert.deepEqual(await deliver(raw, { mailFrom: 'other@example.net' }), { status: 200, body: { results: [{ recipient: accepted, code: 550 }] } });
	assert.equal(stageCalls, 0);
	assert.deepEqual(await deliver(raw, { recipients: [fresh, accepted] }), { status: 200, body: { results: [{ recipient: fresh, code: 451 }, { recipient: accepted, code: 250 }] } });
	assert.equal(stageCalls, 1);
	assert.equal((await deliver(raw, { recipients: [fresh] })).status, 503);
	assert.equal(stageCalls, 2);

	// An accepted receipt can surface between our first lookup and the failed reservation.
	committed = false;
	store.stage = async () => { stageCalls++; committed = true; throw new MailStoreError('QUOTA_EXCEEDED'); };
	assert.deepEqual(await deliver(), { status: 200, body: { results: [{ recipient: accepted, code: 250 }] } });
	assert.equal(stageCalls, 3);
});

test('isolated parse produces safe metadata-only display projection', async () => {
	const raw = Buffer.from('From: a@example.org\r\nSubject: example\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=test\r\n\r\n--test\r\nContent-Type: text/html\r\n\r\n<b>Hello</b><script>alert(1)</script><img src="https://tracker.invalid/x">\r\n--test\r\nContent-Type: text/plain; name="../secret.txt"\r\nContent-Disposition: attachment; filename="../secret.txt"\r\nContent-ID: <safe@example.org>\r\n\r\nsecret\r\n--test--\r\n');
	const parsed = await parseMailIsolated(raw);
	assert.equal(parsed.subject, 'example');
	assert.doesNotMatch(parsed.html, /<script|<img|tracker.invalid/);
	assert.equal(parsed.attachments.length, 1);
	assert.equal(parsed.attachments[0].filename, '.._secret.txt');
	assert.equal(typeof parsed.attachments[0].size, 'number');
	assert.equal('content' in parsed.attachments[0], false);
	assert.equal(parsed.attachments[0].contentId, 'safe@example.org');
	const attachment = await readMailAttachmentIsolated(raw, 0);
	assert.equal(attachment.filename, '.._secret.txt');
	assert.equal(Buffer.from(attachment.content).toString().trim(), 'secret');
	await assert.rejects(readMailAttachmentIsolated(raw, -1), /NOT_FOUND/);
	await assert.rejects(readMailAttachmentIsolated(raw, 1), /MAIL_PARSE_FAILED/);
});
