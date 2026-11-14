/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as tls from 'node:tls';
import {
	buildTextMail, validateMailAddress, classifySmtpFailure, UserMailTransport, parseIncomingMail,
	validateForwardDestination, canStartForward, buildForwardMail,
} from '../../../backend/built/features/email/backend.js';

const identity = { username: 'alice', domain: 'mail.example.org' };
const stable = { messageId: '<test-123@mail.example.org>', date: new Date('2026-01-01T00:00:00Z') };
const limits = { maxRecipients: 10, maxBytes: 100_000 };
const input = { to: ['bob@example.org'], cc: ['carol@example.org'], bcc: ['hidden@example.org'], subject: '日本語 🍆', text: '一行目\n二行目 🍆', displayName: 'ありす' };

test('text MIME is deterministic, server-owned From, CRLF and Bcc is envelope-only', async () => {
	const first = await buildTextMail(input, identity, stable, limits);
	const second = await buildTextMail(input, identity, stable, limits);
	assert.deepEqual(first.raw, second.raw);
	assert.deepEqual(first.envelope.to, [...input.to, ...input.cc, ...input.bcc]);
	assert.equal(first.envelope.from, 'alice@mail.example.org');
	const raw = first.raw.toString();
	assert.match(raw, /Message-ID: <test-123@mail.example.org>/iu);
	assert.match(raw, /Date: Thu, 01 Jan 2026 00:00:00 \+0000/u);
	assert.match(raw, /From: .*<alice@mail.example.org>/u);
	assert.doesNotMatch(raw, /hidden@example.org|^Bcc:/imu);
	assert.doesNotMatch(raw, /(?<!\r)\n/u);
	const parsed = await parseIncomingMail(first.raw);
	assert.equal(parsed.subject, input.subject);
	assert.equal(parsed.from, 'alice@mail.example.org');
	assert.equal(parsed.text.trim().replace(/\r\n/gu, '\n'), input.text);
});

test('header injection, mailbox lists, malformed domains and bounds are rejected', async () => {
	for (const address of ['a@example.org\r\nBcc: x@evil.org', 'a@example.org,b@example.org', 'A <a@example.org>', 'a@-example.org', '.a@example.org', 'a..b@example.org', 'a@example..org']) assert.throws(() => validateMailAddress(address));
	for (const field of ['subject', 'displayName']) await assert.rejects(buildTextMail({ ...input, [field]: 'x\r\nBcc: evil@example.org' }, identity, stable, limits));
	await assert.rejects(buildTextMail(input, { username: 'alice@evil.org', domain: identity.domain }, stable, limits));
	await assert.rejects(buildTextMail(input, identity, stable, { ...limits, maxRecipients: 1 }));
	await assert.rejects(buildTextMail(input, identity, stable, { ...limits, maxBytes: 10 }));
	await assert.rejects(buildTextMail({ ...input, to: [], cc: [], bcc: [] }, identity, stable, limits));
});

test('SMTP classifications never retry ambiguous DATA or missing phase', () => {
	const recipients = ['a@example.org', 'b@example.org'];
	for (const error of [{ command: 'CONN', code: 'ECONNECTION' }, { command: 'DATA', code: 'ECONNRESET' }, { code: 'ETIMEDOUT' }, {}]) {
		const result = classifySmtpFailure(error, recipients);
		assert.equal(result.state, 'unknown');
		assert.deepEqual(result.retryableRecipients, []);
	}
	assert.deepEqual(classifySmtpFailure({ command: 'CONN', code: 'EDNS' }, recipients).retryableRecipients, recipients);
	assert.deepEqual(classifySmtpFailure({ command: 'DATA', responseCode: 451 }, recipients).retryableRecipients, recipients);
	assert.deepEqual(classifySmtpFailure({ command: 'DATA', responseCode: 550 }, recipients).retryableRecipients, []);
	assert.deepEqual(classifySmtpFailure({ command: 'RCPT TO', responseCode: 550, rejectedErrors: [{ recipient: recipients[0], responseCode: 450 }, { recipient: recipients[1], responseCode: 550 }] }, recipients).retryableRecipients, [recipients[0]]);
});

const settings = { enabled: true, destination: 'external@example.net', verifiedAt: new Date(), revision: 3, keepLocalCopy: false };
const mta = { trustedIngress: true, loopChecked: true, forwardingRelay: true };
test('forward requires verified external address, current revision and trusted MTA loop contract', () => {
	assert.throws(() => validateForwardDestination('alice@mail.example.org', ['MAIL.EXAMPLE.ORG']));
	assert.equal(validateForwardDestination('bob@EXAMPLE.NET', ['mail.example.org']), 'bob@example.net');
	const snapshot = { revision: 3, destination: settings.destination, state: 'queued' };
	assert.equal(canStartForward(settings, snapshot), true);
	assert.equal(canStartForward(settings, { ...snapshot, revision: 2 }), false);
	assert.equal(canStartForward(settings, { ...snapshot, state: 'sending' }), false);
	assert.equal(canStartForward({ ...settings, enabled: false }, snapshot), false);
	const raw = Buffer.from('DKIM-Signature: v=1; b=fixture\r\nFrom: Original <a@example.com>\r\nSubject: original\r\n\r\nBody\r\n');
	const prepared = buildForwardMail(raw, '', settings, ['mail.example.org'], mta, 1000);
	assert.equal(prepared.raw, raw);
	assert.deepEqual(prepared.envelope, { from: '', to: [settings.destination] });
	assert.throws(() => buildForwardMail(raw, '', { ...settings, verifiedAt: null }, ['mail.example.org'], mta, 1000));
	assert.throws(() => buildForwardMail(raw, '', settings, ['mail.example.org'], { ...mta, loopChecked: false }, 1000));
});

/** Real local implicit-TLS SMTP fixture; no mail leaves the loopback interface. */
test('TLS relay: partial RCPT, explicit DATA failures, uncertain DATA disconnect and raw forwarding', async t => {
	const directory = mkdtempSync(join(tmpdir(), 'misskey-mail-tls-'));
	const keyPath = join(directory, 'key.pem');
	const certPath = join(directory, 'cert.pem');
	execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'], { stdio: 'ignore' });
	const certificate = readFileSync(certPath, 'utf8');
	const previous = tls.getCACertificates('default');
	tls.setDefaultCACertificates([...previous, certificate]);
	t.after(() => { tls.setDefaultCACertificates(previous); rmSync(directory, { recursive: true, force: true }); });
	let mode = 'success';
	const captures = [];
	const sockets = new Set();
	const server = tls.createServer({ key: readFileSync(keyPath), cert: certificate }, socket => {
		sockets.add(socket);
		socket.on('error', () => {});
		socket.on('close', () => sockets.delete(socket));
		let pending = '';
		let body = null;
		let acceptedCount = 0;
		socket.write('220 localhost fixture\r\n');
		socket.on('data', chunk => {
			pending += chunk.toString('binary');
			while (pending.includes('\r\n')) {
				const index = pending.indexOf('\r\n');
				const line = pending.slice(0, index);
				pending = pending.slice(index + 2);
				if (body !== null) {
					if (line !== '.') { body += `${line.startsWith('..') ? line.slice(1) : line}\r\n`; continue; }
					captures.push(Buffer.from(body, 'binary'));
					body = null;
					if (mode === 'disconnect') socket.destroy();
					else socket.write(mode === 'temporary' ? '451 later\r\n' : mode === 'permanent' ? '550 rejected\r\n' : '250 queued FIXTURE-ID\r\n');
				} else if (line.startsWith('EHLO')) socket.write('250-localhost\r\n250 PIPELINING\r\n');
				else if (line.startsWith('MAIL FROM')) { acceptedCount = 0; socket.write('250 sender ok\r\n'); } else if (line.startsWith('RCPT TO')) {
					if (line.includes('temporary@')) socket.write('450 temporary recipient\r\n');
					else if (line.includes('permanent@')) socket.write('550 permanent recipient\r\n');
					else { acceptedCount++; socket.write('250 recipient ok\r\n'); }
				} else if (line === 'DATA') {
					if (acceptedCount) { body = ''; socket.write('354 send data\r\n'); } else socket.write('554 no recipients\r\n');
				} else if (line === 'QUIT') socket.end('221 bye\r\n');
				else socket.write('250 ok\r\n');
			}
		});
	});
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
	t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); });
	const transport = new UserMailTransport({ host: 'localhost', port: server.address().port, tls: 'implicit' });
	t.after(() => transport.close());
	const prepared = await buildTextMail(input, identity, stable, limits);
	const partial = await transport.submit(prepared.raw, { from: prepared.envelope.from, to: ['ok@example.org', 'temporary@example.org', 'permanent@example.org'] });
	assert.equal(partial.state, 'submitted');
	assert.deepEqual(partial.accepted, ['ok@example.org']);
	assert.deepEqual(partial.retryableRecipients, ['temporary@example.org']);
	assert.deepEqual(new Set(partial.rejected), new Set(['temporary@example.org', 'permanent@example.org']));
	assert.deepEqual(captures[0], prepared.raw);
	const allRejected = await transport.submit(prepared.raw, { from: prepared.envelope.from, to: ['temporary@example.org', 'permanent@example.org'] });
	assert.equal(allRejected.state, 'failed');
	assert.deepEqual(allRejected.retryableRecipients, ['temporary@example.org']);
	assert.equal(captures.length, 1);
	for (const [value, state, retry] of [['temporary', 'failed', true], ['permanent', 'failed', false], ['disconnect', 'unknown', false]]) {
		mode = value;
		const result = await transport.submit(prepared.raw, prepared.envelope);
		assert.equal(result.state, state);
		assert.equal(result.retryableRecipients.length > 0, retry);
	}
	mode = 'success';
	const raw = Buffer.from('DKIM-Signature: v=1; b=fixture\r\nFrom: a@example.net\r\nContent-Type: multipart/mixed; boundary=abc\r\n\r\n--abc\r\nContent-Type: text/plain\r\n\r\n.dot\r\n--abc--\r\n');
	const forwarded = buildForwardMail(raw, '', settings, ['mail.example.org'], mta, 1000);
	assert.equal((await transport.submit(forwarded.raw, forwarded.envelope)).state, 'submitted');
	assert.deepEqual(captures.at(-1), raw);
});
