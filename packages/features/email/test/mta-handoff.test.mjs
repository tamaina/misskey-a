/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parseArguments, resolveConfiguration, deliverMail, main } from '../scripts/mta-handoff.mjs';

const env = { MISSKEY_MAIL_INGRESS_SECRET: 'fixture-only-hmac-secret-32-bytes!', MISSKEY_MAIL_INGRESS_TOKEN: 'fixture-only-bearer-token-32-bytes' };
const args = ['--delivery-id', 'persisted-mta-id_123456', '--mail-from', '', '--recipient', 'alice@example.org'];
const raw = Buffer.from('From: original@example.net\r\nMessage-ID: <not-the-delivery-id@example.net>\r\n\r\n.binary\x00\xff\r\n', 'binary');

async function fixture(t, handler) {
	const server = createServer(handler);
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
	t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
	return { ...env, MISSKEY_MAIL_INGRESS_URL: `http://127.0.0.1:${server.address().port}/v1/deliver`, MISSKEY_MAIL_TIMEOUT_MS: '500' };
}

test('bridge requires explicit stable identity and validates credentials/loopback endpoint/bounds', () => {
	assert.equal(parseArguments(args).mailFrom, '');
	for (const bad of [[], args.slice(2), [...args, '--recipient', 'x@example.org'], ['--delivery-id', 'short', ...args.slice(2)], [...args.slice(0, 5), 'alice@example.org\r\nInjected: true']]) assert.throws(() => parseArguments(bad));
	for (const override of [{ MISSKEY_MAIL_INGRESS_SECRET: '' }, { MISSKEY_MAIL_INGRESS_TOKEN: env.MISSKEY_MAIL_INGRESS_SECRET }, { MISSKEY_MAIL_INGRESS_URL: 'http://example.com/v1/deliver' }, { MISSKEY_MAIL_INGRESS_URL: 'http://localhost/v1/deliver' }, { MISSKEY_MAIL_INGRESS_URL: 'http://127.0.0.1/v1/deliver?token=x' }, { MISSKEY_MAIL_MAX_BYTES: '999999999' }, { MISSKEY_MAIL_TIMEOUT_MS: '0' }]) assert.throws(() => resolveConfiguration({ ...env, ...override }));
});

test('bridge sends byte-exact raw and HMAC v1 envelope; accepts only per-recipient 250', async t => {
	const bodies = [];
	const envelopes = [];
	const settings = await fixture(t, async (request, response) => {
		const chunks = [];
		for await (const chunk of request) chunks.push(chunk);
		const body = Buffer.concat(chunks);
		const envelope = JSON.parse(Buffer.from(request.headers['x-mail-envelope'], 'base64url').toString());
		assert.equal(request.method, 'POST');
		assert.equal(request.url, '/v1/deliver');
		assert.equal(request.headers.authorization, `Bearer ${env.MISSKEY_MAIL_INGRESS_TOKEN}`);
		assert.deepEqual(body, raw);
		assert.equal(envelope.deliveryId, 'persisted-mta-id_123456');
		assert.equal(envelope.mailFrom, '');
		assert.deepEqual(envelope.recipients, ['alice@example.org']);
		assert.ok(Math.abs(Math.floor(Date.now() / 1000) - envelope.timestamp) < 5);
		const payload = JSON.stringify(['misskey-mail-v1', envelope.deliveryId, envelope.timestamp, envelope.mailFrom, envelope.recipients, createHash('sha256').update(body).digest('hex')]);
		assert.equal(request.headers['x-mail-signature'], createHmac('sha256', env.MISSKEY_MAIL_INGRESS_SECRET).update(payload).digest('hex'));
		bodies.push(body); envelopes.push(envelope);
		response.end(JSON.stringify({ results: [{ recipient: 'alice@example.org', code: 250 }] }));
	});
	for (let attempt = 0; attempt < 2; attempt++) assert.equal(await main(args, settings, Readable.from([raw])), 0);
	assert.equal(bodies.length, 2);
	assert.equal(envelopes[0].deliveryId, envelopes[1].deliveryId);
});

test('bridge classifies temporary, permanent, malformed and uncertain responses without retry', async t => {
	let mode;
	let requests = 0;
	const settings = await fixture(t, (request, response) => {
		requests++;
		request.resume();
		if (mode === 'drop') { request.socket.destroy(); return; }
		if (mode === 'timeout') return;
		if (typeof mode === 'number') { response.writeHead(mode); response.end('{}'); return; }
		response.end(mode);
	});
	const cases = [
		[JSON.stringify({ results: [{ recipient: 'alice@example.org', code: 451 }] }), 75],
		[JSON.stringify({ results: [{ recipient: 'alice@example.org', code: 550 }] }), 67],
		[JSON.stringify({ results: [{ recipient: 'other@example.org', code: 250 }] }), 75],
		[JSON.stringify({ results: [{ recipient: 'alice@example.org', code: 250 }, { recipient: 'other@example.org', code: 250 }] }), 75],
		['{}', 75], ['invalid json', 75], ['x'.repeat(20_000), 75],
		[503, 75], [451, 75], [401, 75], [400, 75], [302, 75], [413, 69], ['drop', 75], ['timeout', 75],
	];
	for (const [value, expected] of cases) {
		mode = value;
		assert.equal(await deliverMail(raw, parseArguments(args), resolveConfiguration(settings)), expected, String(value).slice(0, 80));
	}
	assert.equal(requests, cases.length);
});

test('bridge bounds stdin and actual CLI exits without disclosing data', async t => {
	assert.equal(await main(args, { ...env, MISSKEY_MAIL_MAX_BYTES: '1' }, Readable.from([raw])), 69);
	assert.equal(await main(args, env, Readable.from([])), 69);
	assert.equal(await main([], env, Readable.from([raw])), 75);
	const hangingInput = new Readable({ read() {} });
	assert.equal(await main(args, { ...env, MISSKEY_MAIL_TIMEOUT_MS: '10' }, hangingInput), 75);
	const settings = await fixture(t, (request, response) => {
		request.resume();
		response.end(JSON.stringify({ results: [{ recipient: 'alice@example.org', code: 250 }] }));
	});
	const script = fileURLToPath(new URL('../scripts/mta-handoff.mjs', import.meta.url));
	const child = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...settings }, stdio: ['pipe', 'pipe', 'pipe'] });
	let stdout = '';
	let stderr = '';
	child.stdout.on('data', value => { stdout += value; });
	child.stderr.on('data', value => { stderr += value; });
	child.stdin.end(raw);
	assert.equal(await new Promise(resolve => child.on('exit', resolve)), 0);
	assert.equal(stdout, '');
	assert.equal(stderr, '');
});
