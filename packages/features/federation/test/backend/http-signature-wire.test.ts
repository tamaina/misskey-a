/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createServer, request as httpRequest, type IncomingMessage } from 'node:http';
import { once } from 'node:events';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { FastifyReply, FastifyRequest } from 'fastify';
import httpSignature from '@peertube/http-signature';
import { parseRequestSignature, verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import { genRsaKeyPair } from '@features/federation/backend/utility/gen-key-pair.js';
import { ApRequestCreator } from '@features/federation/backend/services/ApRequestService.js';
import { ActivityPubServerService } from '@features/federation/backend/http/ActivityPubServerService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';

const activity = { type: 'Update', actor: 'https://sender.example/users/alice', object: { type: 'Person', name: '日本語 😀' } };
const body = JSON.stringify(activity);
const required = ['(request-target)', 'host', 'date', 'digest'];
let keypair: Awaited<ReturnType<typeof genRsaKeyPair>>;

async function capture(path: string, signer: 'old' | 'new') {
	const key = keypair;
	let receive!: (request: IncomingMessage) => void;
	const received = new Promise<IncomingMessage>(resolve => { receive = resolve; });
	const server = createServer((request, response) => { request.resume(); receive(request); response.end(); });
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const address = server.address();
	if (address == null || typeof address === 'string') throw new Error('Expected loopback address');
	const url = `http://127.0.0.1:${address.port}${path}`;
	try {
		const signed = await ApRequestCreator.createSignedPost({ key: { keyId: 'https://sender.example/users/alice#main-key', privateKeyPem: key.privateKey }, url, body, additionalHeaders: {} });
		const outgoing = httpRequest(url, { method: 'POST', path, headers: signer === 'new' ? signed.request.headers : { date: new Date().toUTCString(), digest: ApRequestCreator.createDigest(body) } });
		if (signer === 'old') httpSignature.sign(outgoing, { key: key.privateKey, keyId: 'https://sender.example/users/alice#main-key', algorithm: 'rsa-sha256', headers: required });
		const completed = new Promise<void>((resolve, reject) => { outgoing.on('response', response => { response.resume(); response.on('end', resolve); }); outgoing.on('error', reject); });
		outgoing.end(body);
		const incoming = await received;
		await completed;
		return { incoming, key, signed };
	} finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

function replaceHeader(request: IncomingMessage, name: string, value: string) {
	request.headers[name] = value;
	for (let index = 0; index < request.rawHeaders.length; index += 2) {
		if (request.rawHeaders[index].toLowerCase() === name) request.rawHeaders[index + 1] = value;
	}
}

function inbox(raw: IncomingMessage, rawBody = body) {
	const queue = mockDeep<QueueService>();
	const service: ActivityPubServerService = Object.assign(Object.create(ActivityPubServerService.prototype), { meta: { federation: 'all' }, config: { host: raw.headers.host }, queueService: queue });
	const request: FastifyRequest = mockDeep<FastifyRequest>();
	request.raw = raw;
	request.headers = raw.headers;
	request.rawBody = Buffer.from(rawBody);
	request.body = activity;
	const reply = mockDeep<FastifyReply>();
	service['inbox'](request, reply);
	return { queue, reply };
}

describe('Draft RSA interoperability on captured Node HTTP requests', () => {
	beforeAll(async () => { keypair = await genRsaKeyPair(); });
	test.each(['old', 'new'] as const)('accepts %s signer, preserves raw target and survives the actual queue JSON boundary', async signer => {
		for (const target of ['/inbox?cursor=a%2Fb&cursor=2', '/inbox?', '/inbox']) {
			const { incoming, key } = await capture(target, signer);
			expect(incoming.url).toBe(target);
			const parsed = parseRequestSignature(incoming, { requiredComponents: { draft: required }, clockSkew: { forward: 300_000, delay: 300_000 } });
			if (parsed.version !== 'draft') throw new Error('Expected Draft signature');
			expect(parsed.value.signingString.split('\n')[0]).toBe(`(request-target): post ${target}`);
			expect(await verifyDraftSignature(parsed.value, key.publicKey)).toBe(true);
			expect(httpSignature.verifySignature(httpSignature.parseRequest(incoming, { headers: required, authorizationHeaderName: 'signature', clockSkew: 300 }), key.publicKey)).toBe(true);
			const accepted = inbox(incoming);
			expect(accepted.reply.code).toHaveBeenCalledWith(202);
			const queuedAdd = vi.fn();
			const queue: QueueService = Object.assign(Object.create(QueueService.prototype), { config: {}, inboxQueue: { add: queuedAdd } });
			queue.inbox(...accepted.queue.inbox.mock.calls[0]);
			const queued = JSON.parse(JSON.stringify(queuedAdd.mock.calls[0][1]));
			expect(queued.activity).toEqual(activity);
			expect(await verifyDraftSignature(queued.signature, key.publicKey)).toBe(true);
			expect(httpSignature.verifySignature(queued.signature, key.publicKey)).toBe(true);
			expect(inbox(incoming, body + ' ').reply.code).toHaveBeenCalledWith(401);
			replaceHeader(incoming, 'digest', ApRequestCreator.createDigest(body + ' '));
			const changed = parseRequestSignature(incoming);
			if (changed.version !== 'draft') throw new Error('Expected Draft signature');
			expect(await verifyDraftSignature(changed.value, key.publicKey)).toBe(false);
		}
	});

	test.each(['date', 'host', 'digest', '(request-target)'])('rejects absent signed component %s before queueing', async component => {
		const { incoming } = await capture('/inbox', 'new');
		const header = incoming.headers.signature;
		if (typeof header !== 'string') throw new Error('Expected Signature header');
		replaceHeader(incoming, 'signature', header.replace(/headers="([^"]*)"/, (_match, headers: string) => `headers="${headers.split(' ').filter(item => item !== component).join(' ')}"`));
		const result = inbox(incoming);
		expect(result.reply.code).toHaveBeenCalledWith(401);
		expect(result.queue.inbox).not.toHaveBeenCalled();
	});

	test.each([-301_000, -299_000, 299_000, 301_000])('enforces date clock skew in both directions: %i ms', async offset => {
		const { incoming } = await capture('/inbox', 'old');
		replaceHeader(incoming, 'date', new Date(Date.now() + offset).toUTCString());
		if (Math.abs(offset) > 300_000) {
			expect(() => parseRequestSignature(incoming, { clockSkew: { forward: 300_000, delay: 300_000 } })).toThrow();
			expect(inbox(incoming).reply.code).toHaveBeenCalledWith(401);
		} else {
			expect(() => parseRequestSignature(incoming, { clockSkew: { forward: 300_000, delay: 300_000 } })).not.toThrow();
		}
	});

	test('malformed Date is rejected at the inbox boundary before enqueueing', async () => {
		const { incoming } = await capture('/inbox', 'new');
		replaceHeader(incoming, 'date', 'invalid-date');
		const result = inbox(incoming);
		expect(result.reply.code).toHaveBeenCalledWith(401);
		expect(result.queue.inbox).not.toHaveBeenCalled();
	});
});
